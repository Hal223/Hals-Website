# Securing your Digital Self
`2024-08-06`

## password managers
A password manager helps you create and store strong, unique passwords for all your online accounts. This eliminates the need to reuse passwords, which is a major security risk. I personal do not recommend using cloud based password managers but they are useful due to their convenience and integration with mobile devices.

- [KeePass](https://keepass.info/download.html)
- [KeePassXC](https://keepassxc.org/download/)
- [pass](https://www.passwordstore.org/) I have setup note for [[linux_pass]]
- [bitwarden](https://bitwarden.com/)
- [1password](https://1password.com/)
- [lastpass](https://www.lastpass.com/)

| Feature        | KeePass | KeePassXC | pass | Bitwarden | 1Password | LastPass |
|----------------|---------|-----------|------|-----------|-----------|----------|
| **Pros**       |         |           |      |           |           |          |
| Open Source    | ✅      | ✅        | ✅   | ✅        | ❌        | ❌       |
| Open Source    | ✅      | ✅        | ✅   | ✅        | ❌        | ❌       |
| Security       | ✅      | ✅        | ✅   | ✅        | ✅        | ✅       |
| Local Storage  | ✅      | ✅        | ✅   | ❌        | ✅        | ❌       |
| Cross-Platform | ✅      | ✅        | ✅   | ✅        | ✅        | ✅       |
| Plugins        | ✅      | ✅        | ❌   | ❌        | ✅        | ✅       |
| GUI            | ✅      | ✅        | ❌   | ✅        | ✅        | ✅       |
| Cloud Sync     | ❌      | ❌        | ❌   | ✅        | ✅        | ✅       |
| **Cons**       |         |           |      |           |           |          |
| Learning Curve | ❌      | ❌        | ✅   | ❌        | ❌        | ❌       |
| CLI Only       | ❌      | ❌        | ✅   | ❌        | ❌        | ❌       |
| No Cloud Sync  | ❌      | ❌        | ✅   | ❌        | ❌        | ❌       |
| Paid Plans     | ❌      | ❌        | ❌   | ✅        | ✅        | ✅       |
  

## Multi-Factor Authentication (MFA)

1. SMS-Based MFA:
    How it works: A code is sent to your registered mobile phone via text message when you try to log in.

    Pros: Widely available, easy to set up and use.
    Cons: Susceptible to SIM swapping attacks and less secure if your phone is lost or stolen.

2. Authenticator App-Based MFA:
    How it works: An app on your smartphone (like Google Authenticator, Authy, or Microsoft Authenticator) generates a time-based one-time password (TOTP) that you enter during login.

    Pros: More secure than SMS, doesn't require a cellular connection.
    Cons: Can be inconvenient if you lose your phone or the app is uninstalled.

  

3. Hardware Security Key:
    How it works: A physical device (like a [YubiKey](https://www.yubico.com/product/yubikey-5c-nfc-fips/) or [Google Titan](https://store.google.com/product/titan_security_key) Security Key) that you plug into your computer or tap on your phone to verify your identity.

    Pros: Highly secure, resistant to phishing and remote attacks.
    Cons: Requires an additional physical device, may not be compatible with all services.

  

4. Biometric MFA:
    How it works: Uses your fingerprint, face, or other unique physical characteristic to authenticate.

    Pros: Convenient, often built into devices.
    Cons: Security concerns about data storage and potential for spoofing.

  

5. Push Notification-Based MFA:
    How it works: You receive a notification on your phone asking you to approve or deny the login attempt.

    Pros: User-friendly, doesn't require entering codes.
    Cons: Relies on your phone being connected to the internet.

  
  

## Securing online accounts

- Due to the importance of these services and how critical they are I personally do not keep these account in a password manager and choose to rotate them every 3 months (change your oil change your password)
- Create: A long (at least 12 characters) password with a mix of uppercase and lowercase letters, numbers, and symbols.
- Avoid: Easily guessable information like your name, birthdate, or common words.
- Tip: Use a password manager to generate and store complex passwords securely.

  

### Securing a google account

TLDR go to your [google](https://myaccount.google.com/) account and follow through the *Data & privacy* and *Security* page options and configure them to your liking.

1. Conduct a Security Checkup:

Go to: myaccount.google.com/security
Review: Recent security events, connected devices, third-party app access, and recovery options.
Action: Remove any unfamiliar devices or apps, update recovery information if needed.

2. Enable Two-Factor Authentication (2FA):

Go to: myaccount.google.com/signinoptions/two-step-verification
Choose: An authentication method like Google Authenticator app, security key, or SMS codes.
Benefit: Adds an extra layer of security, making it significantly harder for unauthorized access even if your password is compromised.

3. Review & Manage Connected Devices & Apps:

Go to: myaccount.google.com/security > "Third-party apps with account access" & "Devices & activity"
Review: The list of apps and devices connected to your account.
Action: Revoke access for any unfamiliar or unused apps and devices.

4. Update Recovery Information:

Go to: myaccount.google.com/security > "Ways we can verify it's you"
Add/Update: Recovery email address and phone number.
Benefit: Ensures you can regain access to your account if you forget your password or get locked out.

  

### Securing an apple account

1. Enable Two-Factor Authentication (2FA):

Go to: Settings > [Your Name] > Password & Security > Two-Factor Authentication.
Follow: The prompts to set up 2FA using your trusted Apple devices or a phone number.
Benefit: Adds an additional layer of security, requiring a verification code from a trusted device whenever you sign in from a new location or device.

2. Review and Manage Trusted Devices:

Go to: Settings > [Your Name] > Password & Security > Account Recovery.
Review: The list of trusted phone numbers and devices associated with your account.
Action: Remove any unfamiliar or unused devices.

3. Keep Your Recovery Information Up to Date:

Go to: Settings > [Your Name] > Password & Security > Account Recovery.
Ensure: Your recovery email address and phone number are accurate and accessible.
Benefit: Allows you to regain access to your account if you forget your password or get locked out.

## Additional Security Tips

### Firefox Relay

[Firefox Relay](https://relay.firefox.com/)'s primary function is to protect your real email address from being exposed online. It creates unique, randomly generated email aliases that you can use when signing up for websites, newsletters, or online services. Any emails sent to these aliases are forwarded to your actual inbox, keeping your real email address hidden. This means not only will you have a unique password for all your accounts but also a unique email/username for each account. Google has a very simular [+trick](https://www.streak.com/post/gmail-plus-addressing-trick) but does not have the same level of securing.

- Reduced Spam: By using aliases, your real email address is less likely to be sold to spammers or end up on marketing lists.
- Enhanced Privacy: Protects your identity by preventing websites from directly associating your online activities with your real email address.
- Easy Management: You can easily create, disable, or delete aliases as needed through the Firefox Relay dashboard.
- Block Unwanted Senders: You can block specific senders from reaching your inbox by deactivating the corresponding alias.

### Privacy.com

[Privacy.com](https://privacy.com/pricing) is a service that allows you to create virtual credit cards for online purchases, enhancing your privacy and security.

- Enhanced Security: Virtual cards act as a buffer between your actual bank account and online merchants. If a virtual card is compromised, you can easily close it without affecting your main credit card.
- Increased Privacy: Virtual cards mask your real card details, preventing merchants from collecting and storing your sensitive financial information.
- Control Spending: Set spending limits or create single-use cards for added control over your online transactions.
- Subscription Management: Easily cancel unwanted subscriptions by closing the associated virtual card.

### Junk Accounts

Junk accounts, often disposable email addresses and temporary passwords, are useful for signing up for services without revealing your primary contact information or for one-time access. This helps avoid spam and protects your privacy.

- https://10minutemail.com/
- https://passgen.co/
- https://passwordsgenerator.net/

## *WHEN* you are compromised

When you suspect or know your online accounts have been compromised, swift action is crucial. Here's a breakdown of the steps you should take, prioritized for maximum effectiveness:

1. If applicable turn the suspected compromised device off.
2. Change Passwords:

Prioritize: Any accounts with financial information (banks, credit cards, PayPal, etc.), then email accounts, and then social media profiles.
Use: Strong, unique passwords for each account. Consider a password manager to help you generate and store complex passwords.

3. Contact Financial Institutions:

If financial accounts were compromised: Immediately inform your bank or credit card company to monitor for fraudulent activity and potentially freeze or replace your cards.

4. Inform Others:

If necessary: Notify friends, family, and colleagues if your compromised accounts may have affected them (e.g., sending spam emails).

5. Monitor Your Accounts:

Regularly: Review your account statements and credit reports for any unauthorized activity.
Report: Immediately dispute any fraudulent charges with your financial institutions.

6. Check for Data Breaches:

Use: Websites like "Have I Been Pwned?" to see if your email address has been involved in any known data breaches.
Action: If your email was part of a breach, change the password for any accounts using that email address.

- https://haveibeenpwned.com/
- https://npd.pentester.com/
- https://www.npdbreach.com/

