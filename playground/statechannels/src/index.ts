// Attaches the channel provider to the window object
require('@statechannels/iframe-channel-provider');

async function main() {
  await window.channelProvider.mountWalletComponent(
    'https://xstate-wallet-v-0-3-0.statechannels.org'
  );
  await window.channelProvider.enable();
}

main();
