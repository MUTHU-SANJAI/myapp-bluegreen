pipeline {
    agent any

    environment {
        IMAGE_NAME = "muthusanjai/myapp-bluegreen"
        BLUE_CONTAINER = "myapp-blue"
        GREEN_CONTAINER = "myapp-green"
        BLUE_PORT = "8081"
        GREEN_PORT = "8082"
        DOCKER_USERNAME = credentials('docker-username') // Jenkins credential ID
        DOCKER_PASSWORD = credentials('docker-password') // Jenkins credential ID
    }

    stages {

        stage('Checkout SCM') {
            steps {
                echo 'Cloning repository...'
                git branch: 'main', url: 'https://github.com/MUTHU-SANJAI/myapp-bluegreen.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                bat "docker build -t %IMAGE_NAME%:latest ."
            }
        }

        stage('Push Docker Image') {
            steps {
                echo 'Logging in and pushing Docker image...'
                bat "echo %DOCKER_PASSWORD% | docker login --username %DOCKER_USERNAME% --password-stdin"
                bat "docker push %IMAGE_NAME%:latest"
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    echo 'Determining active container...'

                    // Get active container
                    def activeContainer = bat(returnStdout: true, script: "docker ps --filter \"name=%BLUE_CONTAINER%\" --format \"{{.Names}}\"").trim()
                    def inactiveContainer = activeContainer == BLUE_CONTAINER ? GREEN_CONTAINER : BLUE_CONTAINER
                    def inactivePort = inactiveContainer == BLUE_CONTAINER ? BLUE_PORT : GREEN_PORT

                    echo "Active container: ${activeContainer ?: 'None'}"
                    echo "Deploying new version to inactive container: ${inactiveContainer}"

                    // Remove old inactive container if it exists
                    def oldContainerId = bat(returnStdout: true, script: "docker ps -aq -f \"name=${inactiveContainer}\"").trim()
                    if (oldContainerId) {
                        echo "Stopping and removing old container: ${inactiveContainer}"
                        bat "docker stop ${oldContainerId}"
                        bat "docker rm ${oldContainerId}"
                    }

                    // Run new inactive container
                    bat "docker run -d --name ${inactiveContainer} -p ${inactivePort}:3000 -e ENVIRONMENT=${inactiveContainer} %IMAGE_NAME%:latest"

                    // Wait a few seconds for container to start
                    bat "ping -n 6 127.0.0.1 > nul"
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    def inactiveContainer = bat(returnStdout: true, script: """
                        docker ps --filter "name=%BLUE_CONTAINER%" --format "{{.Names}}"
                    """).trim() ?: GREEN_CONTAINER

                    echo "Performing health check on container: ${inactiveContainer}"
                    def result = bat(returnStatus: true, script: "curl http://localhost:${inactiveContainer == BLUE_CONTAINER ? BLUE_PORT : GREEN_PORT}")
                    
                    if (result != 0) {
                        error "Health check failed!"
                    } else {
                        echo "Health check passed."
                    }
                }
            }
        }

    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}
