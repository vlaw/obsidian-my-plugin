export class Utils {
    public static verifyAndGetPrefix(name: string): string {
        if (name.length < 13) {
            // 长度不够, 直接跳过
            return null;
        }
        let prefix = name.substr(0, 13);
        if (!prefix.match(/\d{6}-\d{6}/)) {
            // 格式不对, 直接跳过
            return null;
        }
        return prefix;
    }
}