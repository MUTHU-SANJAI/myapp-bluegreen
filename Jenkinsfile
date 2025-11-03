pipeline {
    agent any

    environment {
        // Set your Docker Hub credentials here in Jenkins (Username & Password/Token)
        DOCKER_HUB = credentials('docker-username') // Jenkins credential ID for Docker username
        DOCKER_HUB_PSW = credentials('docker-password') // Jenkins credential ID for Docker password
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
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                    bat 'echo %PASSWORD% | docker login --username %USERNAME% --password-stdin'
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
                    // Check if myapp-blue is running
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
                echo "Checking if the new container is running..."
                // Optional: add curl or PowerShell test for container health
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
