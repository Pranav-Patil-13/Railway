import { Request, Response } from 'express';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { searchTrainsByRoute, getLiveTrainStatus } from '../services/trainService';

export const handleChat = async (req: Request, res: Response) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.'
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "You are RailBot, an AI assistant for the Indian Railways Navigation app. Use the searchTrains tool whenever a user asks for train availability or routes. Provide train numbers, names, and routes clearly. If they ask for live status, use the getLiveTrainStatus tool. If no trains are found, suggest alternative station spellings or searches. Be concise and professional.",
            tools: [{
                functionDeclarations: [{
                    name: "searchTrains",
                    description: "Finds real trains running between two Indian Railway stations.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            from: { type: SchemaType.STRING, description: "Origin station name (e.g., 'Nashik' or 'Mumbai')" },
                            to: { type: SchemaType.STRING, description: "Destination station name (e.g., 'Chalisgaon' or 'Delhi')" },
                        },
                        required: ["from", "to"],
                    },
                }, {
                    name: "getLiveTrainStatus",
                    description: "Gets the live running status of a specific train.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            trainNumber: { type: SchemaType.STRING, description: "The 5-digit train number (e.g. '12051')" },
                        },
                        required: ["trainNumber"],
                    },
                }],
            }],
        });

        const formattedHistory = (history || []).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const chatSession = model.startChat({
            history: formattedHistory,
        });

        let result = await chatSession.sendMessage(message);
        let response = result.response;

        // Handle function calls in a loop (up to 2 iterations for safety)
        let iterations = 0;
        while (response.functionCalls() && iterations < 2) {
            iterations++;
            const calls = response.functionCalls()!;
            const functionResponses = [];

            for (const call of calls) {
                if (call.name === "searchTrains") {
                    const { from, to } = call.args as any;
                    console.log(`RailBot is searching: ${from} to ${to}`);
                    const trains = await searchTrainsByRoute(from, to);

                    functionResponses.push({
                        functionResponse: {
                            name: "searchTrains",
                            response: {
                                success: true,
                                trains: trains.slice(0, 5).map((t: any) => ({
                                    number: t.trainNumber,
                                    name: t.trainName,
                                    source: t.source,
                                    destination: t.destination
                                }))
                            }
                        }
                    });
                } else if (call.name === "getLiveTrainStatus") {
                    const { trainNumber } = call.args as any;
                    console.log(`RailBot is checking live status for: ${trainNumber}`);

                    try {
                        const today = new Date();
                        const yyyy = today.getFullYear();
                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                        const dd = String(today.getDate()).padStart(2, '0');
                        const dateStr = `${yyyy}${mm}${dd}`;

                        const liveData = await getLiveTrainStatus(trainNumber, dateStr);

                        functionResponses.push({
                            functionResponse: {
                                name: "getLiveTrainStatus",
                                response: { success: true, liveData }
                            }
                        });
                    } catch (err: any) {
                        functionResponses.push({
                            functionResponse: {
                                name: "getLiveTrainStatus",
                                response: { success: false, error: "Unable to fetch live status. API might be down or key is invalid." }
                            }
                        });
                    }
                }
            }

            if (functionResponses.length > 0) {
                result = await chatSession.sendMessage(functionResponses);
                response = result.response;
            } else {
                break;
            }
        }

        res.json({ success: true, response: response.text() });
    } catch (error: any) {
        console.error('Chat AI Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to generate response' });
    }
};
