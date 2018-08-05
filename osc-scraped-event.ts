export interface OSCScrapedEvent {
    title: string;
    location: string;
    startTime: string;
    endTime?: string;
    scrapedUrl: string;
    scrapedTime: Date
}
