import * as crypto from 'crypto';

/**
 * 假设一个字符串是符合我们的`ZK name`规范的，那么通过此方法可以得到ZK部分
 *
 * @remarks
 * This method is part of the {@link core-library#Statistics | Statistics subsystem}.
 *
 * @param name - 文件名字符串
 */
export function verifyAndGetPrefix(name: string): string {
    if (name.length < 13) {
        // 长度不够, 直接跳过
        // FIXME: 不见得就是filename
        console.log(`file name: ${name} 长度不够`);
        return null;
    }
    let prefix = name.substring(0, 13);
    if (!prefix.match(/\d{6}-\d{6}/)) {
        // 格式不对, 直接跳过
        console.log(`file name: ${name} , prefix: ${prefix} 不合正则`);
        return null;
    }
    return prefix;
}


export function md5Buffer(buffer: ArrayBuffer): string {
    return crypto.createHash('md5').update(new DataView(buffer)).digest("hex");
}