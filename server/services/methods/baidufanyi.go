package methods

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"
)

const (
// 百度翻译的应用ID和密钥
// appID     = "20250228002287848"    // 替换为你的 App ID
// secretKey = "SMy11XEZ5dpxKZPCa7p5" // 替换为你的 Secret Key
)

type BaiduTranslate struct {
	appId     string
	secretKey string
}

// 百度翻译 API 请求参数结构体
type baiduTranslateRequest struct {
	Q     string `json:"q"`
	From  string `json:"from"`
	To    string `json:"to"`
	AppID string `json:"appid"`
	Salt  string `json:"salt"`
	Sign  string `json:"sign"`
}

func CreateBaiduTranslate(appId, secretKey string) *BaiduTranslate {
	return &BaiduTranslate{
		appId:     appId,
		secretKey: secretKey,
	}
}

func (bt *BaiduTranslate) getSign(query, salt, appID, secretKey string) string {
	// 拼接签名字符串
	str := appID + query + salt + secretKey
	log.Info("str", str)
	// 计算 MD5 哈希
	hash := md5.Sum([]byte(str))
	return fmt.Sprintf("%x", hash)
}

func (bt *BaiduTranslate) Translate(text, fromLang, toLang string) (string, error) {
	// 生成盐值
	salt := fmt.Sprintf("%d", time.Now().Unix())

	// log.Info("salt", salt)

	// 构造请求参数
	sign := bt.getSign(text, salt, bt.appId, bt.secretKey)
	// reqBody := baiduTranslateRequest{
	// 	Q:     text,
	// 	From:  fromLang,
	// 	To:    toLang,
	// 	AppID: bt.appId,
	// 	Salt:  salt,
	// 	Sign:  sign,
	// }

	// log.Info(bt.appId, bt.secretKey, sign)

	// 将请求参数转为 JSON 格式
	// reqJSON, err := json.Marshal(reqBody)
	// if err != nil {
	// 	return "", err
	// }

	// 发送 HTTP POST 请求
	resp, err := http.Get(
		"https://fanyi-api.baidu.com/api/trans/vip/translate?q=" +
			text + "&from=" + fromLang + "&to=" + toLang + "&appid=" + bt.appId +
			"&salt=" + salt + "&sign=" + sign)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// 读取响应内容
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// 解析返回的 JSON
	var result map[string]interface{}
	err = json.Unmarshal(body, &result)
	if err != nil {
		return "", err
	}

	// 获取翻译结果
	if translation, ok := result["trans_result"]; ok {
		// trans_result 是一个数组，包含翻译结果
		translatedText := translation.([]interface{})[0].(map[string]interface{})["dst"].(string)
		return translatedText, nil
	}

	return "", fmt.Errorf("translation failed: %v", result)
}
