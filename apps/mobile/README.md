# My Personal Assistant Mobile

## Run on a physical phone

1. Start the backend on the development computer and make sure it listens on a LAN-accessible interface.
2. Copy `.env.example` to `.env` and replace `YOUR_COMPUTER_LAN_IP` with the computer's LAN IP.
3. Install mobile dependencies and start Expo from `apps/mobile`:

```bash
npm install
npm run start
```

4. Open the Expo development build/Expo Go on the phone while the phone and computer are on the same network.

The mobile app keeps the selected language locally and uses Persian RTL when `fa` is selected. The floating brain button opens the live assistant endpoint at `/assistant`.

## Development checks

```bash
npm run typecheck
```

<!-- Trigger standalone Android APK validation via GitHub Actions. -->
