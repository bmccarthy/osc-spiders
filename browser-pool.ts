import * as puppeteer from 'puppeteer';
import * as genericPool from 'generic-pool';
import debug from 'debug';
const log = debug('osc-spiders');

export class BrowserPool {
  private browser: puppeteer.Browser;

  constructor() { }

  async createPool() {
    log("[POOL] Creating pool");
    const opt = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
    this.browser = await puppeteer.launch(opt);

    const factory: genericPool.Factory<puppeteer.Page> = {
      create: async () => {
        log("[POOL] Creating new page from pool");
        const page = await this.browser.newPage();
        return page;
      },
      destroy: (page: puppeteer.Page) => {
        log("[POOL] Destroying page in pool");
        return page.close();
      },
    };

    const options: genericPool.Options = { max: 10, min: 2 };

    const browserPagePool = genericPool.createPool(factory, options);

    return browserPagePool;
  }

  destroyPool() {
    log("[POOL] Destroying pool");
    return this.browser.close();
  }
}
