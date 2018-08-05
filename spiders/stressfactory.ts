import debug from 'debug';
const log = debug('osc-spiders');
import * as genericPool from 'generic-pool';
import * as puppeteer from 'puppeteer';

import { OSCScrapedEvent } from '../osc-scraped-event';
import { DucklingApi } from '../duckling-api';
import { Spider } from '../spider';

class StressFactorySpider implements Spider {
    private duckling = new DucklingApi();

    constructor(private pool: genericPool.Pool<puppeteer.Page>) { }

    async crawl(): Promise<OSCScrapedEvent[]> {
        const url = 'http://newbrunswick.stressfactory.com/events';
        const location = 'Stress Factory New Brunswick, 90 Church Street, New Brunswick, NJ 08901';

        const page = await this.pool.acquire();

        log('scraping ' + url);
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitFor(500);

        const items: any[] = await page.evaluate(() => {
            const items = [];

            const events = [...document.querySelectorAll(".event-list-item")];

            events.forEach(event => {
                const title = event.querySelector(".el-header").textContent;
                const showtimes = [...event.querySelectorAll(".event-times-list .event-times-group")];

                if (showtimes.length == 0) {
                    const dateTime = event.querySelector(".event-date").textContent;

                    items.push({
                        dateTime,
                        title
                    });
                }

                showtimes.forEach(showtime => {
                    const date = showtime.querySelector(".event-date").textContent;
                    const times = [...showtime.querySelectorAll(".event-btn-inline")].map(timeEl => timeEl.textContent);

                    items.push({
                        date,
                        title,
                        times
                    });
                });
            });

            return items;
        });

        const oscItems: OSCScrapedEvent[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (item.times && item.times.length > 0) {
                item.times.forEach(async time => {
                    const dateTime = await this.duckling.getDateTime(item.date + ' ' + time);
                    oscItems.push({
                        scrapedTime: new Date(),
                        title: item.title,
                        location: location,
                        startTime: dateTime.from,
                        scrapedUrl: url
                    });
                });

            } else if (item.dateTime) {
                const dateTime = await this.duckling.getDateTime(item.dateTime);
                oscItems.push({
                    scrapedTime: new Date(),
                    title: item.title,
                    location: location,
                    startTime: dateTime.from,
                    scrapedUrl: url
                });
            }
        }

        await this.pool.release(page);

        return oscItems;
    }
}

module.exports = StressFactorySpider;
