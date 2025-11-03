pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials') // Jenkins DockerHub credentials
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
                    // Detect currently active container
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

                    // Determine new environment
                    def newEnv = activeContainer.contains('blue') ? 'green' : 'blue'
                    echo "Deploying new version to ${newEnv} environment..."

                    def containerName = "myapp-${newEnv}"
                    def hostPort = newEnv == 'blue' ? '8090' : '8091'

                    // Stop and remove old container safely
                    if (activeContainer) {
                        bat """
                            docker stop ${activeContainer} 2>nul || echo Container not running
                            docker rm ${activeContainer} 2>nul || echo Container already removed
                        """
                    }

                    // Run new container
                    bat """
                        docker run -d --name ${containerName} -p ${hostPort}:8080 -e ENVIRONMENT=${newEnv} ${DOCKER_IMAGE}:${BUILD_NUMBER}
                    """

                    // Wait for container to start
                    echo "Waiting 15 seconds for container to start..."
                    sleep 15

                    // Health check using docker ps (Windows-friendly)
                    def healthCheck = bat(
                        script: "docker ps --filter name=${containerName} --format {{.Status}}",
                        returnStdout: true
                    ).trim()

                    if (healthCheck.contains("Up")) {
                        echo "✅ ${newEnv} container is running. Deployment successful!"
                    } else {
                        error("❌ New deployment failed to start.")
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
