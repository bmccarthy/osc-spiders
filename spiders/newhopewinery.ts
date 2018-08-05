import debug from 'debug';
const log = debug('osc-spiders');
import * as genericPool from 'generic-pool';
import * as puppeteer from 'puppeteer';

import { OSCScrapedEvent } from '../osc-scraped-event';
import { DucklingApi } from '../duckling-api';
import { Spider } from '../spider';

class NewHopeWinerySpider implements Spider {
    private duckling = new DucklingApi();

    constructor(private pool: genericPool.Pool<puppeteer.Page>) { }

    private async getEventDetailLinks(): Promise<string[]> {
        let pageNumber = 1;

        const links = [];

        const page = await this.pool.acquire();

        while (true) {
            await page.goto(`https://newhopewinery.com/live-music/page/${pageNumber}`);

            const noMoreLinks: boolean = await page.content().then(content => content.indexOf("There are no upcoming Events at this time") > 0);
            if (noMoreLinks || pageNumber > 7) {
                break;
            }

            const pageLinks = await page.evaluate(() => {
                return [...document.querySelectorAll('.iee_event')]
                    .map(event => event.querySelector('a'))
                    .map(link => link.href);
            });

            links.push(...pageLinks);
            pageNumber++;
        }

        await this.pool.release(page);

        log(`New Hope Winery has ${links.length} events`);
        return links;
    }

    private async getEventDetails(url: string): Promise<OSCScrapedEvent> {
        const location = 'New Hope Winery, 6123 Lower York Road, New Hope, PA 18938';

        const page = await this.pool.acquire();

        log('scraping ' + url);
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitFor(500);

        const title: string = await page.evaluate(() => {
            let title;
            const titleEl = document.querySelector('.entry-title');
            if (titleEl) title = titleEl.textContent;
            return title || "";
        });

        const dateTimeString = await page.evaluate(() => {
            const elemtn = document.querySelector(".iee_organizermain .details");
            return [...elemtn.querySelectorAll("p")].map(item => item.textContent.trim()).join(" ");
        });

        const dateTime = await this.duckling.getDateTime(dateTimeString);

        await this.pool.release(page);

        return {
            title,
            startTime: dateTime.from,
            endTime: dateTime.to,
            location: location,
            scrapedUrl: url,
            scrapedTime: new Date()
        };
    }

    async crawl(): Promise<OSCScrapedEvent[]> {
        const links: string[] = await this.getEventDetailLinks();

        const itemPromises = links.map(link => this.getEventDetails(link).catch(err => {
            log("[ERROR] scraping link: " + link);
            log("[ERROR]");
            log(err);
            return null;
        }));

        const items = await Promise.all(itemPromises);

        return items.filter(item => item != null);
    }
}

module.exports = NewHopeWinerySpider;
