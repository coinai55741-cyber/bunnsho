/**
 * 數據駭客 (Data Hacker) - 拼音與錯字修改器 (Pinyin & Typos Modifier)
 * 
 * 本模組負責核心的「出錯」邏輯：
 * 1. 隨機篡改客語拼音（變更聲調、入聲尾音、母音）
 * 2. 隨機替換錯別字（形似字、同音字）
 * 3. 整合工程師在課文 JSON 中手動指定的「自訂錯誤」與「自訂選項」，保有手動調整彈性。
 */

const PinyinModifier = {
    // 客語常用聲調符號（四縣腔）
    TONE_MARKS: ['ˊ', 'ˇ', 'ˋ', 'ˆ', '⁺'],

    // 形似字與同音字字典（用於漢字除錯，工程師可在此擴充常用錯字）
    HOMOPHONES_AND_TYPOS: {
        "𠊎": ["挨", "崖", "涯"],
        "食": ["十", "石", "蝕"],
        "朝": ["潮", "昭", "招"],
        "飯": ["反", "犯", "範"],
        "粄": ["板", "版", "叛"],
        "包": ["胞", "跑", "飽"],
        "豬": ["珠", "諸", "朱"],
        "肉": ["入", "月", "玉"],
        "乳": ["入", "路", "魯"],
        "麵": ["面", "免", "棉"],
        "牛": ["流", "留", "扭"],
        "營": ["贏", "迎", "影"],
        "養": ["央", "樣", "仰"],
        "漢": ["汗", "瀚", "看"],
        "汁": ["什", "直", "十"],
        "糖": ["唐", "塘", "躺"],
        "久": ["九", "舊", "韭"],
        "床": ["創", "闖", "雙"]
    },

    /**
     * 隨機篡改單個音節拼音
     * @param {string} pinyin 原始正確單音節拼音
     * @returns {string} 篡改後的錯誤拼音
     */
    corruptPinyinSingle: function(pinyin) {
        if (!pinyin) return pinyin;
        
        // 1. 剝離聲調，找出基礎字元與原聲調
        let currentMark = '';
        let base = pinyin;
        for (let mark of this.TONE_MARKS) {
            if (pinyin.includes(mark)) {
                currentMark = mark;
                base = pinyin.replace(mark, '');
                break;
            }
        }
        
        // 偵測韻尾類型
        let isStop = base.endsWith('p') || base.endsWith('b') || 
                     base.endsWith('t') || base.endsWith('d') || 
                     base.endsWith('k') || base.endsWith('g');
                     
        let isNasal = base.endsWith('ng') || base.endsWith('m') || 
                      (base.endsWith('n') && !base.endsWith('ng'));
                      
        // 隨機決定篡改策略 (聲調置換 vs 韻尾置換 vs 母音置換)
        let strategies = ['tone'];
        if (isStop) strategies.push('stop');
        if (isNasal) strategies.push('nasal');
        if (base.includes('a') || base.includes('o') || base.includes('i') || base.includes('u') || base.includes('e')) {
            strategies.push('vowel');
        }
        
        let strategy = strategies[Math.floor(Math.random() * strategies.length)];
        
        if (strategy === 'tone') {
            // 規則 ①：聲調篡改
            if (currentMark !== '') {
                // 原本有聲調，隨機更換為別的調號或無聲調
                let otherMarks = this.TONE_MARKS.filter(m => m !== currentMark);
                otherMarks.push(''); // 允許改為無聲調
                let randomMark = otherMarks[Math.floor(Math.random() * otherMarks.length)];
                return base + randomMark;
            } else {
                // 原本無聲調，隨機加一個
                let randomMark = this.TONE_MARKS[Math.floor(Math.random() * this.TONE_MARKS.length)];
                return base + randomMark;
            }
        } else if (strategy === 'stop') {
            // 規則 ②：入聲韻尾混淆
            let lastChar = base.slice(-1);
            let baseWithoutLast = base.slice(0, -1);
            let replacedChar = lastChar;
            
            if (lastChar === 'p' || lastChar === 'b') {
                replacedChar = Math.random() < 0.5 ? (lastChar === 'p' ? 't' : 'd') : (lastChar === 'p' ? 'k' : 'g');
            } else if (lastChar === 't' || lastChar === 'd') {
                replacedChar = Math.random() < 0.5 ? (lastChar === 't' ? 'p' : 'b') : (lastChar === 't' ? 'k' : 'g');
            } else if (lastChar === 'k' || lastChar === 'g') {
                replacedChar = Math.random() < 0.5 ? (lastChar === 'k' ? 'p' : 'b') : (lastChar === 'k' ? 't' : 'd');
            }
            return baseWithoutLast + replacedChar + currentMark;
        } else if (strategy === 'nasal') {
            // 規則 ③：鼻音韻尾混淆
            if (base.endsWith('ng')) {
                let baseWithoutLast = base.slice(0, -2);
                let replaced = Math.random() < 0.5 ? 'm' : 'n';
                return baseWithoutLast + replaced + currentMark;
            } else if (base.endsWith('m')) {
                let baseWithoutLast = base.slice(0, -1);
                let replaced = Math.random() < 0.5 ? 'n' : 'ng';
                return baseWithoutLast + replaced + currentMark;
            } else if (base.endsWith('n')) {
                let baseWithoutLast = base.slice(0, -1);
                let replaced = Math.random() < 0.5 ? 'm' : 'ng';
                return baseWithoutLast + replaced + currentMark;
            }
        } else if (strategy === 'vowel') {
            // 額外規則：母音置換偏誤
            let replacedBase = base;
            if (base.includes('a')) replacedBase = base.replace('a', 'o');
            else if (base.includes('o')) replacedBase = base.replace('o', 'a');
            else if (base.includes('i')) replacedBase = base.replace('i', 'e');
            else if (base.includes('u')) replacedBase = base.replace('u', 'i');
            else if (base.includes('e')) replacedBase = base.replace('e', 'i');
            return replacedBase + currentMark;
        }
        
        return pinyin;
    },

    /**
     * 隨機篡改拼音 (支援單字及詞組)
     * @param {string} pinyin 原始正確拼音
     * @returns {string} 篡改後的錯誤拼音
     */
    corruptPinyin: function(pinyin) {
        if (!pinyin) return pinyin;
        
        // 規則 ④：詞組整組改錯 (若含有空白則為詞組拼音)
        if (pinyin.includes(' ')) {
            let parts = pinyin.split(/\s+/);
            let bugIdx = Math.floor(Math.random() * parts.length);
            
            // 確保對選中的那個音節進行篡改
            let original = parts[bugIdx];
            let corrupted = this.corruptPinyinSingle(original);
            let attempts = 0;
            while (corrupted === original && attempts < 20) {
                corrupted = this.corruptPinyinSingle(original);
                attempts++;
            }
            parts[bugIdx] = corrupted;
            return parts.join(' ');
        }
        
        return this.corruptPinyinSingle(pinyin);
    },

    /**
     * 隨機或依設定替換漢字錯字
     * @param {string} char 原始漢字
     * @param {string} [customWrongChar] 工程師手動指定的錯別字
     * @returns {string} 替換後的錯字
     */
    corruptCharacter: function(char, customWrongChar) {
        if (customWrongChar) return customWrongChar;
        
        // 從預設字典中尋找對應的形似/同音字
        const typoPool = this.HOMOPHONES_AND_TYPOS[char];
        if (typoPool && typoPool.length > 0) {
            return typoPool[Math.floor(Math.random() * typoPool.length)];
        }
        
        return char + "仔";
    },

    /**
     * 生成 4 個單選補丁選項，且嚴格去重，確保不包含 displayed 錯誤拼音
     * @param {string} correct 正確答案
     * @param {string} displayed 畫面上顯示的錯誤值
     * @param {Array<string>} [customDistractors] 工程師手動指定的干擾項
     * @returns {Array<string>} 打亂順序後的 4 個選項
     */
    generateOptions: function(correct, displayed, customDistractors) {
        // 標準化字串比較函數：去除首尾空白，並將 Unicode 正規化為 NFC 格式，避免因不可見字元或聲調符號編碼不同導致比較失效
        const clean = (s) => s ? s.toString().trim().normalize('NFC') : '';
        const cleanCorrect = clean(correct);
        const cleanDisplayed = clean(displayed);
        
        let optionsSet = new Set();
        // 為了比對，我們記錄標準化後的字串集合
        let cleanOptionsSet = new Set();
        
        // 加入正確答案
        optionsSet.add(correct);
        cleanOptionsSet.add(cleanCorrect);
        
        // 優先使用自訂干擾項，且干擾項不得等於正確或畫面上顯示的錯誤拼音
        if (customDistractors && Array.isArray(customDistractors)) {
            customDistractors.forEach(d => {
                if (d) {
                    let cleanD = clean(d);
                    if (cleanD !== cleanCorrect && cleanD !== cleanDisplayed) {
                        optionsSet.add(d);
                        cleanOptionsSet.add(cleanD);
                    }
                }
            });
        }
        
        // 如果選項不足 4 個，使用自動篡改算法補齊
        let attempts = 0;
        while (optionsSet.size < 4 && attempts < 200) {
            let dist = this.corruptPinyin(correct);
            if (dist) {
                let cleanDist = clean(dist);
                if (cleanDist !== cleanCorrect && cleanDist !== cleanDisplayed && !cleanOptionsSet.has(cleanDist)) {
                    optionsSet.add(dist);
                    cleanOptionsSet.add(cleanDist);
                }
            }
            attempts++;
        }
        
        // 再次兜底（防死循環），依據聲調做微調，且排除 correct 與 displayed
        const fallbackTones = ['', 'ˊ', 'ˇ', 'ˋ', 'ˆ', '⁺'];
        
        if (correct.includes(' ')) {
            let parts = correct.split(/\s+/);
            let lastPart = parts[parts.length - 1];
            let lastPartBase = lastPart.replace(/[ˊˇˋˆ⁺]/g, '');
            
            for (let tone of fallbackTones) {
                if (optionsSet.size >= 4) break;
                let copyParts = [...parts];
                copyParts[copyParts.length - 1] = lastPartBase + tone;
                let candidate = copyParts.join(' ');
                let cleanCand = clean(candidate);
                if (cleanCand !== cleanCorrect && cleanCand !== cleanDisplayed && !cleanOptionsSet.has(cleanCand)) {
                    optionsSet.add(candidate);
                    cleanOptionsSet.add(cleanCand);
                }
            }
        } else {
            let base = correct.replace(/[ˊˇˋˆ⁺]/g, '');
            for (let tone of fallbackTones) {
                if (optionsSet.size >= 4) break;
                let candidate = base + tone;
                let cleanCand = clean(candidate);
                if (cleanCand !== cleanCorrect && cleanCand !== cleanDisplayed && !cleanOptionsSet.has(cleanCand)) {
                    optionsSet.add(candidate);
                    cleanOptionsSet.add(cleanCand);
                }
            }
        }
        
        // 打亂順序
        return Array.from(optionsSet).sort(() => Math.random() - 0.5);
    },

    /**
     * 將一個單字節點處理成「受損資料節點」
     * @param {Object} wordNode 課文單字數據 {char: "家", pinyin: "gaˊ"}
     * @param {string} [errorType] 限制出錯類型 ("pinyin" 或 "character"，未指定則隨機)
     * @returns {Object} 帶有 Bug 的字卡節點狀態
     */
    createCorruptedNode: function(wordNode, errorType = 'pinyin') {
        const isPinyinError = errorType === 'pinyin';
        
        let correctValue = isPinyinError ? wordNode.pinyin : wordNode.char;
        let corruptedValue = "";
        
        if (isPinyinError) {
            corruptedValue = wordNode.custom_wrong_pinyin || this.corruptPinyin(correctValue);
            let attempts = 0;
            while (corruptedValue === correctValue && attempts < 20) {
                corruptedValue = this.corruptPinyin(correctValue);
                attempts++;
            }
        } else {
            corruptedValue = this.corruptCharacter(wordNode.char, wordNode.custom_wrong_char);
        }
        
        const options = this.generateOptions(
            correctValue, 
            corruptedValue, 
            wordNode.custom_distractors
        );

        return {
            char: isPinyinError ? wordNode.char : corruptedValue,
            correct_char: wordNode.char,
            displayed_pinyin: isPinyinError ? corruptedValue : wordNode.pinyin,
            correct_pinyin: wordNode.pinyin,
            error_type: errorType,
            correct_answer: correctValue,
            options: options
        };
    }};

// 如果是 Node.js 環境則導出，瀏覽器環境則直接掛在 window 下
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PinyinModifier;
} else {
    window.PinyinModifier = PinyinModifier;
}
