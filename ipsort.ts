import {createWriteStream, readFileSync, opendirSync, Dir} from "fs";
import {readFile} from "fs/promises";

const dirPath = "./logs/";
!async function () {
	const dir: Dir = opendirSync(dirPath);
	for await (let dirElement of dir) {
		if (!dirElement.isFile()) {
			continue;
		}
		const filePath = dirPath + dirElement.name;
		const s = readFileSync("./logs/access80.log").toString();
		const stream = createWriteStream(filePath + ".ini", "utf-8");
		const map = new Map<string, string[]>();
		{
			const split = s.split("\n");
			console.log(split.length);
			split.forEach(str => {
				const number = str.indexOf(" ");
				const ip = str.substring(0, number);
				const text = str.substring(number + 1);
				const strings = map.get(ip);
				if (strings == null) {
					map.set(ip, [text]);
				} else {
					strings.push(text);
				}
			});
		}
		{
			const write = (text: string): void => {
				if (stream.write(text)) {
					stream.emit("drain");
				}
			};

			for (const [ip, texts] of map) {
				write(`[${ip}]\n`);
				texts.forEach((text, i) => {
					write(`${i}=${text}\n`);
				});
				write("\n");
			}
		}
		stream.close();
		console.log(`${filePath}完成`);
	}
	//*/
}();
