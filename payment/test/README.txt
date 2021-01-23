## Unit test for the payment module
### how to run
execute in the root folder of the module (ie. the payment directory):
```bash
npm install
npm run build  #optional
npm run test
```

### expected result
```
 PASS  test/stackchannels.test.ts (13.418 s)
  test statechannel payment
    ✓ 1: seeder and leecher handshake (36 ms)
    ✓ 2: leecher deposit eth to the channel (998 ms)
    ✓ 3: seeder request eth from leecher (334 ms)
    ✓ 4: leecher wants to finalize the channel (1737 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        13.482 s, estimated 18 s
Ran all test suites.
```
