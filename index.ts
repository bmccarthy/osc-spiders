import axios from "axios";
import { BrowserPool } from './browser-pool';
import debug from 'debug';
import { OSCScrapedEvent } from "./osc-scraped-event";
const log = debug('osc-spiders');

import * as fs from 'fs';

function getAllSpiders(pool): any[] {
    const spiderDirectory = __dirname + '/spiders';
    const spiderFileNames: string[] = fs.readdirSync(spiderDirectory);

    const spiders = spiderFileNames
        .map(file => require(spiderDirectory + "/" + file))
        .filter(SpiderConstructor => SpiderConstructor.name.toLowerCase().indexOf("newhope") < 0)
        .map(SpiderConstructor => new SpiderConstructor(pool));

    return spiders;
}

async function crawl() {
    log("Starting crawl...");
    const poolFactory = new BrowserPool();
    const pool = await poolFactory.createPool();

    const spiders = getAllSpiders(pool);

    const promises: Promise<any>[] = [];

    spiders.forEach(spider => {
        log("Running Spider..." + spider.constructor.name);
        promises.push(spider.crawl().then(items => upload(items)));
    });

    log("Waiting for all spiders to finish crawling");
    await Promise.all(promises);

    log("Draining the pool");
    await pool.drain().then(() => pool.clear());

    await poolFactory.destroyPool();
    log("Finished...");
}

async function upload(items: OSCScrapedEvent[]) {
    log(`Uploading ${items.length} to API`);
    return axios.post("https://api.trackedpixel.com/osc-events", items)
}

crawl();
