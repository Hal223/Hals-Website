# Securing Your Secrets: A Look at the Linux pass Utility
`2025-06-09`
pass is a simple shell script that manages passwords by storing them in a directory structure, where each password resides in a GPG-encrypted file. The filename itself typically corresponds to the service or website the password is for, making it intuitive to navigate and manage your credentials using standard command-line utilities.

## Install

- Install for Distro
```bash
sudo apt update && sudo apt install pass gnupg
#or
sudo dnf install pass gnupg2
```
- Generate & import Keys
```bash
gpg --full-generate-key
gpg --list-secret-keys --keyid-format=long
pass init YOUR_KEY_ID
```

## Migrate

1. Identify Your Key ID:
```bash
gpg --list-keys
```
2. Export the Public Key and Private Key:
```bash
gpg --export YOUR_KEY_ID > public-key.asc
gpg --export-secret-keys YOUR_KEY_ID > private-key.asc
```
3. Importing to a new machine:
```bash
    gpg --import public-key.asc
    gpg --import private-key.asc
    gpg --edit-key YOUR_KEY_ID
    gpg> trust
    # Trust 5
    gpg> quit
    pass init YOUR_KEY_ID
```

---
References
[pass](https://www.passwordstore.org/)