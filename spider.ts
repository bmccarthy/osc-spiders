import { OSCScrapedEvent } from './osc-scraped-event';

export interface Spider {
    crawl(): Promise<OSCScrapedEvent[]>;
}
