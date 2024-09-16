# semantic-release-docker-tag
  <a href="https://www.npmjs.com/package/semantic-release-docker-tag">
    <img alt="npm latest version" src="https://img.shields.io/npm/v/semantic-release-docker-tag/latest.svg">
  </a>

A package to use [semantic-release](https://github.com/semantic-release/semantic-release) with docker images, without the need of a docker binary.

## Why?
Other semantic-release plugins for docker will require a docker binary and the image pulled/build to local storage. 
This plugins adds the new version tag to an already pushed image.


## Supported Steps

### verifyConditions

Verifies that required settings are set and tries to load source manifest with provided credentials

### publish

Fetches the source manifest and pushes it with the new version


## Tested registries
The authentication was tested with the following registries
- harbor
- nexus
- github
- dockerhub
- gitlab registry

# Installation
> npm i --save-dev semantic-release-docker-tag

or
> yarn add -D semantic-release-docker-tag

And include the plugin inside the `plugins` section of the `semantic-release` configuration.

```
{
  "plugins": [
    ...,
    "semantic-release-docker-tag"
  ]
}
```


# Configuration
Every option can be set using Environment variable or the plugin config

Example:
```
{
  "plugins": [
    ["semantic-release-docker-tag", {
            
      }
    ]
  ]
}
```


| Config Option      | Environment variable | Required | Default              | Description                                                 |
|--------------------|----------------------|----------|----------------------|-------------------------------------------------------------|
| `registryUrl`      | `REGISTRY_URL`       | No       | `registry.docker.io` | URL of the remote registry, without any protocol            |
| `registryProtocol` | `REGISTRY_PROTOCOL`  | No       | `https`              | Protocol of the remote registry, `https` or `http`          |
| `registryUser`     | `REGISTRY_USER`      | Yes      | -                    | The user used to access the registry                        |
| `registryPassword` | `REGISTRY_PASSWORD`  | Yes      | -                    | The password for the user used                              |
| `sourceTag`        | `SOURCE_TAG`         | Yes      | -                    | The source tag which should be retagged (ex. `$COMMIT_SHA`) |
| `registryImage`    | `REGISTRY_IMAGE`     | Yes      | -                    | The image receiving the version (ex `hello/world`)          |


# Example CI Config

## Gitlab

```
stages:
  - build-docker
  - semantic-release

build-image:
  stage: build-docker
  image:
    name: gcr.io/kaniko-project/executor:debug
    entrypoint: [""]
  script:
    - echo "{\"auths\":{\"$CI_REGISTRY\":{\"username\":\"$CI_REGISTRY_USER\",\"password\":\"$CI_REGISTRY_PASSWORD\"}}}" > /kaniko/.docker/config.json
    - /kaniko/executor --context . --dockerfile ./Dockerfile --destination $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG --destination $CI_REGISTRY_IMAGE:branch-$CI_COMMIT_BRANCH
    
semantic-release:
  stage: semantic-release
  image: node
  before_script:
    - npm install semantic-release
    - npm install @semantic-release/git
    - npm install @semantic-release/gitlab    
    - npm install semantic-release-docker-tag
  script:
     # Gitlab CI Variables already set in project settings
     # REGISTRY_USER, REGISTRY_PASSWORD, REGISTRY_URL, REGISTRY_IMAGE
    - export SOURCE_TAG=$CI_COMMIT_SHA
    - |
      cat > .releaserc << EOF
      {
        "branches": ["master", "main"],
        "debug": true,
        "plugins": [
          "@semantic-release/commit-analyzer",
          "@semantic-release/gitlab",
          "semantic-release-docker-tag"
        ]
      }
      EOF
    - semantic-release
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH 
      when: always
```

