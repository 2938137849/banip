import {createWriteStream, Dir} from "fs";
import {opendir, readFile} from "fs/promises";

const dirPath = "./logs/";
opendir(dirPath).then(async (dir: Dir) => {
	for await (let dirElement of dir) {
		if (!dirElement.isFile()) {
			continue;
		}
		const filePath = dirPath + dirElement.name;
		readFile(filePath).then(buffer => {
			const s = buffer.toString();
			const map = new Map<string, string[]>();
			// 读取
			const split = s.split("\n");
			console.log(`${filePath} 总行数：${split.length}`);
			for (const str of split) {
				const number = str.indexOf(" ");
				const ip = str.substring(0, number);
				const text = str.substring(number + 1);
				const strings = map.get(ip);
				if (strings == null) {
					map.set(ip, [text]);
				} else {
					strings.push(text);
				}
			}
			return map;
		}).then(map => {
			const stream = createWriteStream(filePath + ".ini", "utf-8");
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
			stream.close();
			console.log(`${filePath}完成`);
		});
	}
});
