pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_IMAGE = "${DOCKERHUB_CREDENTIALS_USR}/myapp-bluegreen"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/MUTHU-SANJAI/myapp-bluegreen.git'
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

                    def containerName = "myapp-${newEnv}"
                    def hostPort = newEnv == 'blue' ? '8090' : '8091'

                    // Remove any stopped container with the same name
                    bat """
                        docker rm -f ${containerName} 2>nul || echo No existing container to remove
                    """

                    // Run new container
                    bat """
                        docker run -d --name ${containerName} -p ${hostPort}:8080 -e ENVIRONMENT=${newEnv} ${DOCKER_IMAGE}:${BUILD_NUMBER}
                    """

                    // Wait for container to start
                    sleep 5

                    // Health check
                    def healthCheck = bat(
                        script: "curl -s http://localhost:${hostPort}",
                        returnStatus: true
                    )

                    if (healthCheck == 0) {
                        echo "✅ ${newEnv} environment healthy. Switching traffic..."
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
