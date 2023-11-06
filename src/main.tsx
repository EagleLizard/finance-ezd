
import sourceMapSupport from 'source-map-support';
sourceMapSupport.install();

import { transactions } from './lib/transactions/transactions';

(async () => {
  try {
    await main();
  } catch(e) {
    console.error(e);
    throw e;
  }
})();

async function main() {
  await transactions();
}
