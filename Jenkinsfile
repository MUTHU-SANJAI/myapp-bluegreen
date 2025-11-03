pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_IMAGE = "${DOCKERHUB_CREDENTIALS_USR}/myapp-bluegreen"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/<your-username>/myapp-bluegreen.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    dockerImage = docker.build("${DOCKER_IMAGE}:${BUILD_NUMBER}")
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    docker.withRegistry('', 'dockerhub-credentials') {
                        dockerImage.push("${BUILD_NUMBER}")
                        dockerImage.push("latest")
                    }
                }
            }
        }

        stage('Blue-Green Deploy') {
            steps {
                script {
                    def activeContainer = sh(script: "docker ps --filter 'name=myapp-' --format '{{.Names}}' | head -n 1", returnStdout: true).trim()
                    def newEnv = activeContainer.contains('blue') ? 'green' : 'blue'

                    echo "Deploying new version to ${newEnv} environment..."

                    // Run new container
                    sh """
                        docker run -d --name myapp-${newEnv} -p ${newEnv == 'blue' ? '8080:8080' : '8081:8080'} \
                        -e ENVIRONMENT=${newEnv} ${DOCKER_IMAGE}:${BUILD_NUMBER}
                    """

                    sleep 5

                    def healthCheck = sh(script: "curl -s http://localhost:${newEnv == 'blue' ? '8080' : '8081'}", returnStatus: true)

                    if (healthCheck == 0) {
                        echo "✅ ${newEnv} environment healthy. Switching traffic..."
                        if (activeContainer) {
                            sh "docker stop ${activeContainer} && docker rm ${activeContainer}"
                        }
                    } else {
                        error("❌ New deployment failed health check.")
                    }
                }
            }
        }
    }
}
