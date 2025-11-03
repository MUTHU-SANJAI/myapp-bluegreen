pipeline {
    agent any

    environment {
        // Docker Hub credentials stored in Jenkins
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_IMAGE = "${DOCKERHUB_CREDENTIALS_USR}/myapp-bluegreen"
    }

    stages {
        stage('Checkout') {
            steps {
                // Replace with your actual GitHub public repo URL
                git branch: 'main', url: 'https://github.com/MUTHU-SANJAI/myapp-bluegreen.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build Docker image with build number as tag
                    dockerImage = docker.build("${DOCKER_IMAGE}:${BUILD_NUMBER}")
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    // Push Docker image to Docker Hub
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
                    // Detect currently active container (blue or green)
                    def activeContainer = bat(
                        script: '''
                            @echo off
                            setlocal enabledelayedexpansion
                            set ACTIVE=
                            for /f "tokens=1*" %%i in ('docker ps --filter "name=myapp-" ^| findstr "myapp-" ^| findstr /v "CONTAINER"') do (
                                set ACTIVE=%%i
                                goto :found
                            )
                            :found
                            echo !ACTIVE!
                        ''',
                        returnStdout: true
                    ).trim()

                    def newEnv = activeContainer.contains('blue') ? 'green' : 'blue'
                    echo "Deploying new version to ${newEnv} environment..."

                    // Determine port based on environment
                    def port = newEnv == 'blue' ? '8080:8080' : '8081:8080'

                    // Run new container in the inactive environment
                    bat """
                        docker run -d --name myapp-${newEnv} -p ${port} -e ENVIRONMENT=${newEnv} ${DOCKER_IMAGE}:${BUILD_NUMBER}
                    """

                    // Wait a few seconds for the container to start
                    sleep 5

                    // Health check on the new container
                    def healthCheck = bat(
                        script: "curl -s http://localhost:${newEnv == 'blue' ? '8080' : '8081'}",
                        returnStatus: true
                    )

                    if (healthCheck == 0) {
                        echo "✅ ${newEnv} environment healthy. Switching traffic..."
                        // Stop old container after new one is healthy
                        if (activeContainer) {
                            bat "docker stop ${activeContainer} && docker rm ${activeContainer}"
                        }
                    } else {
                        error("❌ New deployment failed health check.")
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed. Check console output for details."
        }
    }
}
