const {getEnvOrConfig, dockerRequest} = require("./util")
const axios = require("axios")


module.exports = async (pluginConfig, { nextRelease: { version }, logger }) => {
    const sourceTag = process.env["SOURCE_TAG"]
    logger.log("Fetching manifest for tag " + sourceTag)

    const image = getEnvOrConfig("REGISTRY_IMAGE", "registryImage", pluginConfig)

    // Fetching source Manifest

    const manifest = await dockerRequest(pluginConfig, 'get', `/v2/${image}/manifests/${sourceTag}`, {
        headers: {
            'accept': 'application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.index.v1+json'
        }
    })

    if (manifest.status != 200) {
        throw new Error(`Failed to fetch manifest ${image}:${sourceTag}`)
    }

    // Putting source manifest under new tg

    const tagResponse = await dockerRequest(pluginConfig, 'put', `/v2/${image}/manifests/${version}`,{
        headers: {
            'content-type': manifest.headers.get("content-type")
        },
        data: manifest.data
    })
    if (tagResponse.status >= 200 && tagResponse.status < 300) {
        logger.log(`Image tagged with version ${version}`)
    } else {
        logger.log(`Failed to tag with version ${version}, with status code ${tagResponse.status}, ${JSON.stringify(tagResponse.data)}`)
    }

}
