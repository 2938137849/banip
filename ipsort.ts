import {createWriteStream, Dir} from "fs";
import {opendir, readFile, writeFile} from "fs/promises";

const dirPath = "./logs/";
const regex = /(?<ip>[^ ]+) - (?<user>[^ ]+) \[(?<datetime>[^\]]+)] "(?<method>[A-Z]*) ?(?<url>[^ "]*)(?: (?<protocol>[^"]+))?" (?<status>\d+) (?<bytes>\d+) "(?<referer>[^"]*)" "(?<agent>[^"]*)"/;
opendir(dirPath).then(async (dir: Dir) => {
	const map = new Map<string, Log[]>();
	for await (let dirElement of dir) {
		if (!dirElement.isFile() || !dirElement.name.endsWith(".log")) {
			continue;
		}
		const filePath = dirPath + dirElement.name;
		// 读取
		const split = (await readFile(filePath)).toString().split("\n");
		await writeFile(filePath, "");
		console.log(`${filePath} 总行数：${split.length}`);
		for (const str of split) {
			const groups = regex.exec(str)?.groups;
			if (groups == null) {
				console.log(str);
				continue;
			}
			const ip: string = groups["ip"];
			const log: Log = new Log(dirElement.name, groups);
			const strings = map.get(ip);
			if (strings == null) {
				map.set(ip, [log]);
			} else {
				strings.push(log);
			}
		}
	}
	return map;
}).then(map => {
	const filePath = "./sorted.yml";
	const stream = createWriteStream(filePath, "utf-8");
	const write = (text: string): void => {
		if (stream.write(text)) {
			stream.emit("drain");
		}
	};

	for (const [ip, texts] of map) {
		write(`${ip}:\n`);
		texts.forEach((log) => {
			write(`  - ${JSON.stringify(log)}\n`);
		});
		write("\n");
	}
	stream.close();
	console.log(`${filePath} 完成`);
});

class Log {
	fromFile: string;
	user: string;
	datetime: string;
	method: string;
	url: string;
	protocol: string;
	status: number;
	bytes: number;
	referer: string;
	agent: string;

	constructor(fromFile: string, groups: { [s: string]: string }) {
		this.fromFile = fromFile;
		this.user = groups["user"];
		this.datetime = groups["datetime"];
		this.method = groups["method"];
		this.url = groups["url"];
		this.protocol = groups["protocol"];
		this.status = +groups["status"];
		this.bytes = +groups["bytes"];
		this.referer = groups["referer"];
		this.agent = groups["agent"];
	}
}
