const {getEnvOrConfig, getEnvOrConfigOrDefault, buildDefaultAxiosArgsRegistry} = require("./util")
const axios = require("axios");


module.exports = async (pluginConfig, { nextRelease: { version }, logger }) => {
    const sourceTag = process.env["SOURCE_TAG"];
    logger.log("Fetching manifest for tag " + sourceTag);

    const image = getEnvOrConfig("REGISTRY_IMAGE", "registryImage", pluginConfig)

    const manifest = await axios({
        ...buildDefaultAxiosArgsRegistry(pluginConfig, 'GET', `/v2/${image}/manifests/${sourceTag}`)
    })

    if (manifest.status != 200) {
        throw new Error(`Failed to fetch manifest ${image}:${sourceTag}`)
    }

    const tagResponse = axios({
        ...buildDefaultAxiosArgsRegistry(pluginConfig, 'PUT', `/v2/${image}/manifests/${version}`),
        data: manifest.data
    })
    if (tagResponse.status == 200) {
        console.log(`Image tagged with version ${version}`)
    } else {
        console.log(`Failed to tag with version ${version}, with status code ${tagResponse.status}`)
    }

}
