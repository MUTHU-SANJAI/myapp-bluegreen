pipeline {
    agent any

    environment {
        IMAGE_NAME = "muthusanjai/myapp-bluegreen"
        BLUE_CONTAINER = "myapp-blue"
        GREEN_CONTAINER = "myapp-green"
        BLUE_PORT = "8090"
        GREEN_PORT = "8091"
        DOCKER_HUB_CREDENTIALS = "docker-hub" // Replace with your Jenkins credential ID
    }

    stages {

        stage('Checkout SCM') {
            steps {
                echo 'Cloning repository...'
                git branch: 'main',
                    url: 'https://github.com/MUTHU-SANJAI/myapp-bluegreen.git'
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
                echo 'Logging in to Docker Hub and pushing image...'
                withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDENTIALS}", passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    bat 'echo %DOCKER_PASSWORD% | docker login --username %DOCKER_USERNAME% --password-stdin'
                    bat "docker push %IMAGE_NAME%:latest"
                }
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    echo 'Determining active container...'
                    def activeContainer = bat(returnStdout: true, script: "docker ps --filter \"name=%BLUE_CONTAINER%\" --format \"{{.Names}}\"").trim()
                    def inactiveContainer = activeContainer == BLUE_CONTAINER ? GREEN_CONTAINER : BLUE_CONTAINER
                    def inactivePort = inactiveContainer == BLUE_CONTAINER ? BLUE_PORT : GREEN_PORT

                    echo "Active container: ${activeContainer ?: 'None'}"
                    echo "Deploying new version to inactive container: ${inactiveContainer}"

                    // Remove old inactive container if exists
                    bat """
                        for /F "tokens=*" %i in ('docker ps -aq -f "name=${inactiveContainer}"') do (
                            docker stop %i
                            docker rm %i
                            echo Removed old ${inactiveContainer} container %i
                        )
                    """

                    // Run new inactive container
                    bat "docker run -d --name ${inactiveContainer} -p ${inactivePort}:3000 -e ENVIRONMENT=${inactiveContainer} %IMAGE_NAME%:latest"

                    // Wait 5 seconds for container to start (Windows-safe)
                    bat "ping -n 6 127.0.0.1 > nul"
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo 'Running Health Check on newly deployed container...'
                    def activeContainer = bat(returnStdout: true, script: "docker ps --filter \"name=%BLUE_CONTAINER%\" --format \"{{.Names}}\"").trim()
                    def inactiveContainer = activeContainer == BLUE_CONTAINER ? GREEN_CONTAINER : BLUE_CONTAINER
                    def inactivePort = inactiveContainer == BLUE_CONTAINER ? BLUE_PORT : GREEN_PORT

                    // Simple Health Check
                    def result = bat(returnStatus: true, script: "curl -s -o NUL -w \"%{http_code}\" http://localhost:${inactivePort}")
                    if (result != 0) {
                        error "Health Check Failed for container ${inactiveContainer} on port ${inactivePort}"
                    } else {
                        echo "Health Check Passed for container ${inactiveContainer} on port ${inactivePort}"
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
