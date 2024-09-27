
const {getEnvOrConfig, getEnvOrConfigOrDefault, dockerRequest} = require("./util")
const axios = require("axios")

module.exports = async (pluginConfig, { logger }) => {
    const requiredVars = [
        {
            env: 'REGISTRY_USER',
            config: 'registryUser'
        },
        {
            env: 'REGISTRY_PASSWORD',
            config: 'registryPassword'
        },
        {
            env: 'SOURCE_TAG',
            config: 'sourceTag'
        }
    ]
    for (const requiredEnv of requiredVars) {
        if (!getEnvOrConfigOrDefault(requiredEnv.env, requiredEnv.config, pluginConfig, undefined)) {
            throw new Error(`Missing required env variable ${requiredEnv}`)
        }
    }

    const sourceTag = getEnvOrConfig("SOURCE_TAG", "sourceTag", pluginConfig);
    const image = getEnvOrConfig("REGISTRY_IMAGE", "registryImage", pluginConfig)

    // Test fetch source artifact

    const response = await dockerRequest(pluginConfig, 'get', `/v2/${image}/manifests/${sourceTag}`, {
        headers: {
            'accept': 'application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.index.v1+json'
        }
    })

    if (response.status < 200 || response.status >= 300) {
        throw new Error("Failed to fetch source manifest " + response.status + " " + response.data)
    }


}
