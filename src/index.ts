// Reading `.env` file
import 'dotenv/config'
import { App } from './app'
import { getConfig } from './config'

async function initializeApp() {
	const app = await App()
	const config = getConfig()

	app.listen(config.PORT, '0.0.0.0')
}

initializeApp()
