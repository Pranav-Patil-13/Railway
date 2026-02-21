import kagglehub
import os
import shutil

# Download latest version
path = kagglehub.dataset_download("dnyaneshyeole/indian-trains")

print(f"Dataset downloaded to: {path}")

# List files in the path
files = os.listdir(path)
print(f"Files found: {files}")

# We want to make this accessible to our TS script easily. 
# Let's find any CSV files and copy them to our data folder.
target_dir = os.path.join(os.getcwd(), 'src', 'scripts', 'data', 'kaggle')
os.makedirs(target_dir, exist_ok=True)

for file in files:
    if file.endswith('.csv'):
        shutil.copy(os.path.join(path, file), os.path.join(target_dir, file))
        print(f"Copied {file} to {target_dir}")
