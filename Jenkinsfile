pipeline {
    agent any
    environment {
        DOCKER_HUB = credentials('docker-hub')
    }
    stages {
        stage('Test Docker Login') {
            steps {
                echo "Logging in to Docker Hub..."
                bat """
                    echo %DOCKER_HUB_PSW% | docker login --username %DOCKER_HUB_USR% --password-stdin
                """
            }
        }
    }
}
