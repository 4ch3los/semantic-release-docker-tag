
const {getEnvOrConfig, getEnvOrConfigOrDefault, buildDefaultAxiosArgsRegistry} = require("./util")
const axios = require("axios");

module.exports = async (pluginConfig, { logger }) => {
    for (const requiredEnv of ['REGISTRY_USER', 'REGISTRY_PASSWORD', 'SOURCE_TAG']) {
        if (!process.env[requiredEnv]) {
            throw new Error(`Missing required env variable ${requiredEnv}`)
        }
    }
    const response = await axios({
        ...buildDefaultAxiosArgsRegistry(pluginConfig, 'GET', '/v2/')
    })

    if (response.status != 200) {
        throw new Error("Failed to authenticate with registry")
    }


}
