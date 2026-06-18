# TRInk Signing Preparation

Version: `0.3.11`

TRInk beta builds are currently unsigned.

What this means:

- Windows SmartScreen warnings are expected for unsigned beta installers.
- Testers should verify the installer source before running it.
- TRInk does not use obfuscation, packers, or SmartScreen bypass tricks.
- Unsigned status is a release-readiness gap, not something to work around with hiding or repacking.

## Production Signing Checklist

Use a real code-signing process before public distribution.

1. Acquire a valid code-signing certificate from a trusted certificate authority.
2. Keep the publisher identity consistent with TRInk bundle metadata:
   - Product: `TradeReality Ink`
   - Publisher: `TradeReality`
   - Executable: `trink.exe`
3. Sign the Windows executable and installer.
4. Timestamp signatures during signing so they remain verifiable after certificate expiration.
5. Verify the signed outputs before release handoff.

## Placeholder Command Shape

These are placeholders only. They are not ready-to-run commands and do not imply signing is already configured.

```powershell
signtool sign /fd SHA256 /tr <timestamp-url> /td SHA256 /a <artifact-path>
signtool verify /pa <artifact-path>
```

Before using production commands, define:

- certificate source and access method
- timestamp provider
- CI or local release signing flow
- verification and audit steps

## Current Beta Policy

- Beta packages remain unsigned until a real certificate-based flow is implemented.
- Do not add fake signatures.
- Do not add packers or obfuscation to reduce warnings.
- Do not change publisher identity between builds.
