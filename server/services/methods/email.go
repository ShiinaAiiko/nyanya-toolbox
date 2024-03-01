package methods

import (
	"crypto/tls"
	"net/smtp"
	"strings"
	"time"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/i18n"
	ni18n "github.com/cherrai/nyanyago-utils/i18n"
	"github.com/cherrai/nyanyago-utils/nstrings"
	"github.com/jordan-wright/email"
)

func SendEmail(to, title, content string) error {
	e := email.NewEmail()
	e.From = conf.Config.Email.User
	e.To = []string{to}
	// e.To = []string{"shiina@aiiko.club"}
	e.Subject = title

	e.HTML = []byte(content)
	return e.SendWithTLS(conf.Config.Email.Host+":"+nstrings.ToString(conf.Config.Email.Port), smtp.PlainAuth(
		"",
		conf.Config.Email.User,
		conf.Config.Email.Pass,
		conf.Config.Email.Host,
	), &tls.Config{
		ServerName: conf.Config.Email.Host,
	})
}

func GetMoveCarEmailContent(carNum, language string) string {

	return strings.Replace(
		strings.Replace(
			strings.Replace(
				strings.Replace(
					conf.EmailTemplate,
					"{{logo-text}}", i18n.I18n.T("title", ni18n.TOptions{
						NS:       "moveCarQRC",
						Language: language,
					}), 1),
				"{{title}}", i18n.I18n.T("emailTitle", ni18n.TOptions{
					NS:       "moveCarQRC",
					Language: language,
				}), 1),
			"{{content}}", `
      <span>`+i18n.I18n.T("emailContent1", ni18n.TOptions{
				NS:       "moveCarQRC",
				Language: language,
				Replace: map[string]string{
					"carNum": carNum,
				},
			})+`</span>
			<br>
			<span>`+i18n.I18n.T("emailContent2", ni18n.TOptions{
				NS:       "moveCarQRC",
				Language: language,
			})+`</span>
      <br>
      <br>
      <span style="color:#999;">`+i18n.I18n.T("emailContent3", ni18n.TOptions{
				NS:       "moveCarQRC",
				Language: language,
			})+`</span>`, 1),
		"{{footer}}", "@2021-"+nstrings.ToString(time.Now().Year())+" "+i18n.I18n.T("title", ni18n.TOptions{
			Language: language,
		}), 1)
}
