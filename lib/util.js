const https = require("node:https")

const getEnvOrConfig = (envName, configName, pluginConfig) => {
    if (process.env[envName]) {
        return process.env[envName];
    }

    if (pluginConfig[configName]) {
        return pluginConfig[configName];
    }

    throw new Error(`No value found in env(${envName}) or pluginConfig(${configName})`)
}

const buildDefaultAxiosArgsRegistry = (pluginConfig, method, url) => {
    return {
        baseURL: getEnvOrConfigOrDefault("REGISTRY_PROTOCOL", "registryProtocol", pluginConfig, "https")
            + "://"
            + getEnvOrConfig("REGISTRY_URL", "registryUrl", pluginConfig),
        url: url,
        auth: {
            username: process.env['REGISTRY_USER'],
            password: process.env['REGISTRY_PASSWORD']
        },
        method: method,
        validateStatus: () => true
    }
}

const getEnvOrConfigOrDefault = (envName, configName, pluginConfig, defaultValue) => {
    try {
        return getEnvOrConfig(envName, configName, pluginConfig)
    } catch (err) {
        return defaultValue
    }
}


module.exports = {
    getEnvOrConfig,
    getEnvOrConfigOrDefault,
    buildDefaultAxiosArgsRegistry
}
