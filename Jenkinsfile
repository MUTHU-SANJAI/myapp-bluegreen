pipeline {
    agent any

    environment {
        IMAGE_NAME = 'muthusanjai/myapp-bluegreen:latest'
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo "Checking out code from GitHub..."
                checkout scm
            }
        }

        stage('Docker Login') {
            steps {
                echo "Logging in to Docker Hub..."
                // Make sure you create credentials in Jenkins with ID 'docker-hub-credentials'
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', 
                                                  usernameVariable: 'DOCKER_USER', 
                                                  passwordVariable: 'DOCKER_PSW')]) {
                    bat 'echo %DOCKER_PSW% | docker login --username %DOCKER_USER% --password-stdin'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."
                bat "docker build -t %IMAGE_NAME% ."
            }
        }

        stage('Push Docker Image') {
            steps {
                echo "Pushing Docker image to Docker Hub..."
                bat "docker push %IMAGE_NAME%"
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    echo "Determining active container..."
                    def activeContainer = bat(script: 'docker ps --filter "name=myapp-blue" --format "{{.Names}}"', returnStdout: true).trim()
                    def inactiveContainer = activeContainer == 'myapp-blue' ? 'myapp-green' : 'myapp-blue'

                    echo "Deploying new version to inactive container: ${inactiveContainer}"

                    bat """
                    docker stop ${inactiveContainer} || echo ${inactiveContainer} not running
                    docker rm ${inactiveContainer} || echo ${inactiveContainer} removed
                    docker run -d --name ${inactiveContainer} -p 8080:80 %IMAGE_NAME%
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                echo "Checking running containers..."
                bat 'docker ps --filter "name=myapp-blue" --filter "name=myapp-green"'
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed. Check logs for details."
        }
    }
}
