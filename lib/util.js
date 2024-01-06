const https = require("node:https")
const axios = require("axios")

/**
 * Get the value from env oder plugin config. Env has the higher priority. If both dont exist, throws error
 *
 * @param envName environment variable name
 * @param configName config field name
 * @param pluginConfig the plugin config
 * @returns Returns a matching value if it exists, order: env -> config -> error
 */
const getEnvOrConfig = (envName, configName, pluginConfig) => {
    if (process.env[envName]) {
        return process.env[envName]
    }

    if (pluginConfig[configName]) {
        return pluginConfig[configName]
    }

    throw new Error(`No value found in env(${envName}) or pluginConfig(${configName})`)
}

/**
 * Get the value from env oder plugin config. Env has the higher priority. If both dont exist, returns defaultValue
 *
 * @param envName environment variable name
 * @param configName config field name
 * @param pluginConfig the plugin config
 * @param defaultValue fallback value
 * @returns Returns the env var, config value or fallback defaultValue
 */
const getEnvOrConfigOrDefault = (envName, configName, pluginConfig, defaultValue) => {
    try {
        return getEnvOrConfig(envName, configName, pluginConfig)
    } catch (err) {
        return defaultValue
    }
}

/**
 * Creates a base options object for axios requests to a registry
 *
 * @param pluginConfig the plugin config
 * @param method Http method, GET/PUT/POST/...
 * @param url the relative requested path
 * @returns axios options object
 */
const buildDefaultAxiosArgsRegistry = (pluginConfig, method, url) => {
    return {
        baseURL: getEnvOrConfigOrDefault("REGISTRY_PROTOCOL", "registryProtocol", pluginConfig, "https")
            + "://"
            + getEnvOrConfigOrDefault("REGISTRY_URL", "registryUrl", pluginConfig, "registry.docker.io"),
        url: url,
        method: method,
        validateStatus: () => true
    }
}

/**
 * Tries to do the request without auth and authenticates with basic or bearer if necessary
 *
 * @param pluginConfig the plugin config
 * @param method Http method, GET/PUT/POST/...
 * @param url the relative requested path
 * @param options additional axios options
 * @returns axios response
 */
const dockerRequest = async (pluginConfig, method, url, options) => {
    // Try without authentication

    const response = await axios({
        ...buildDefaultAxiosArgsRegistry(pluginConfig, method, url),
        ...options
    })

    if (response.status>= 200 && response.status < 300) {
        return response
    }

    if (response.status >= 500) {
        throw new Error(`Docker Registry request failed, ${method} ${url}, with status ${response.status} ${response}`)
    }


    if (response.headers['www-authenticate']) {
        const authenticateHeader = response.headers['www-authenticate'].toLowerCase()

        console.log("Need to authenticated with", authenticateHeader)

        // Use basic auth
        if (authenticateHeader.startsWith("basic")) {
            return axios({
                ...buildDefaultAxiosArgsRegistry(pluginConfig, method, url),
                ...options,
                auth: {
                    username: getEnvOrConfig('REGISTRY_USER', 'registryUser', pluginConfig),
                    password:  getEnvOrConfig('REGISTRY_PASSWORD', 'registryPassword', pluginConfig)
                }
            })

        // Use bearer auth
        } else if (authenticateHeader.startsWith("bearer")){
            const token = await authenticateBearer(authenticateHeader.replace("bearer ", ""), pluginConfig)

            let axiosOptions = {
                ...buildDefaultAxiosArgsRegistry(pluginConfig, method, url),
                ...options,
            }

            if(!axiosOptions.headers) {
                axiosOptions.headers = {}
            }

            axiosOptions.headers["authorization"] = "Bearer " + token

            return axios(axiosOptions)
        }
    }

    return response.headers
}


/**
 * Parses the value of www-authenticate('realm="test",kebab="test"') into an object {realm: "test", kebab: "test"}
 *
 * @param data the fetched header data
 * @returns parsed object
 */
const parseParams = (data) => {
    let result = {}
    const regex = /([\w-]+)="(\\"|[^"]*)"/g

    let match
    while ((match = regex.exec(data)) !== null) {
        let key = match[1]
        let value = match[2]
        result[key] = value
    }

    return result
}

/**
 * Fetch bearer token from realm
 *
 * @param data www-authenticate content
 * @param pluginConfig the plugin config
 * @returns {Promise<*>} Promise with the token or an error
 */
const authenticateBearer = async  (data, pluginConfig) => {
    const params = parseParams(data)
    if (!params.realm) {
        throw new Error(`Authentication header does not contain realm: ${data}`)
    }


    const url = params.realm + "?" + Object.entries(params).filter(([key, value]) => key != "realm").map(([key, value]) => key + "=" + value).join("&")


    console.log("Authenticating with url", url)

    const response = await axios({
        url,
        auth: {
            username: getEnvOrConfig('REGISTRY_USER', 'registryUser', pluginConfig),
            password:  getEnvOrConfig('REGISTRY_PASSWORD', 'registryPassword', pluginConfig)
        },
        method: 'get',

        validateStatus: () => true

    })

    console.log(response.status, response.data)

    if (response.data.token) {
        return response.data.token
    }
    throw new Error(`Failed to authenticate ${response.status} ${response.data}`)
}



module.exports = {
    getEnvOrConfig,
    getEnvOrConfigOrDefault,
    dockerRequest
}
