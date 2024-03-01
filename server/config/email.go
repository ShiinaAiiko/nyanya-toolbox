package conf

var EmailTemplate = `<table class="root" border="0" cellspacing="0" cellpadding="0" lang="en">
<style>
	.root {
		width: 100%;
		height: 100%;
		min-width: 348px;
		background-color: rgb(250, 250, 250);
	}

	.root-body {
		border-width: thin;
		border-color: #dadce0;
		border-radius: 6px;
		padding: 40px 20px;
		background-color: #fff;
		border-top: 6px solid #f29cb2;
	}

	.logo {
		margin: 10px 0 16px;
		display: flex;
		align-items: center;
		justify-content: center;

	}

	.logo-text {
		font-size: 28px;
		font-weight: 600;

	}

	.title {
		font-size: 24px;
	}

	.content {
		font-family: Roboto-Regular, Helvetica, Arial, sans-serif;
		font-size: 14px;
		color: rgba(0, 0, 0, 0.87);
		line-height: 20px;
		padding-top: 20px;
		text-align: left;
	}

	.content-code {
		text-align: center;
		font-size: 36px;
		margin-top: 20px;
		line-height: 44px;
	}

	.footer {
		font-family: Roboto-Regular, Helvetica, Arial, sans-serif;
		color: rgba(0, 0, 0, 0.54);
		font-size: 11px;
		line-height: 18px;
		padding-top: 12px;
		text-align: center;
	}
</style>
<tbody>

	<tr height="32" style="height: 32px;">
		<td></td>
	</tr>
	<tr align="center">
		<td>
			<div itemscope="itemscope" itemtype="//schema.org/EmailMessage">
				<div itemprop="action" itemscope="itemscope" itemtype="//schema.org/ViewAction">
				</div>
			</div>
			<table border="0" cellspacing="0" cellpadding="0"
				style="padding-bottom: 20px; max-width: 516px; min-width: 220px;">
				<tbody>
					<tr>
						<td width="8" style="width: 8px;"></td>
						<td>
							<div class="root-body" align="center" class="mdv2rw">

								<div class="logo">
									<!-- <img src=""
											width="74" height="24" aria-hidden="true"> -->
									<span class="logo-text">{{logo-text}}</span>
								</div>
								<div class="title">
									{{title}}
								</div>
								<div class="content">
									{{content}}
								</div>
							</div>
							<div class="footer">
								<span>{{footer}}</span>
							</div>
						</td>
						<td width="8" style="width: 8px;"></td>
					</tr>
				</tbody>
			</table>
		</td>
	</tr>
	<tr height="32" style="height: 32px;">
		<td></td>
	</tr>
</tbody>
</table>
</table>`
