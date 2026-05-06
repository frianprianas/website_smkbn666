import os

path = r'c:\Users\Administrator\Documents\website_baknus\website_smkbn666\frontend\src'
old_str = 'http://localhost:8000'
# We use a placeholder that works inside both template literals and normal strings if possible, 
# but it's better to just replace it with a variable reference.
# For template literals: `http://localhost:8000${...}` -> `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${...}`
new_str = "${import.meta.env.VITE_API_URL || 'http://localhost:8000'}"

for root, dirs, files in os.walk(path):
    for file in files:
        if file.endswith(('.jsx', '.js')):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if old_str in content:
                print(f"Updating {file_path}")
                # Careful: if it's NOT inside a template literal, this might break.
                # But looking at the grep, most are inside `...`
                new_content = content.replace(old_str, new_str)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
