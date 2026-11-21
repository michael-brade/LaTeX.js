// mocha root hooks (loaded by "file" in the mocha config): one pair of browsers for all test files
import { launchBrowsers, closeBrowsers } from './browsers.ts';

export { chrome, firefox, takeScreenshot } from './browsers.ts';

before(launchBrowsers);
after(closeBrowsers);
