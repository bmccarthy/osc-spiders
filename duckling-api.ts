import axios from "axios";
const qs = require("qs");

export class DucklingApi {
    async getDateTime(text: string) {
        if (!text) return { from: "", to: "" };

        const response = await axios.post('http://0.0.0.0:8000/parse', qs.stringify({ locale: "en_GB", text: text }));

        for (let i = 0; i < response.data.length; i++) {
            const item = response.data[i];

            if (item.dim === 'time' && item.value.type === "interval") {
                return { from: item.value.from.value, to: item.value.to.value };
            } else if (item.dim === 'time' && item.value.type === "value") {
                return { from: item.value.value, to: item.value.value };
            }
        }
        return { from: "", to: "" };
    }
}
