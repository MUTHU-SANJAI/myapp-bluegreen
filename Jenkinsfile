pipeline {
    agent any
    stages {
        stage('Test Credentials') {
            steps {
                echo "Logging in to Docker..."
                bat "echo %DOCKER_PASSWORD% | docker login --username %DOCKER_USERNAME% --password-stdin"
            }
        }
    }
}
