pipeline {
    agent any

    tools {
        nodejs 'NodeJS' // Ensure Node.js is installed in Jenkins
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t masala-and-mug .'
            }
        }
    }

    post {
        always {
            junit 'test-results.xml' // If you configure Jest to output JUnit XML
        }
        success {
            echo 'Tests passed!'
        }
        failure {
            echo 'Tests failed!'
        }
    }
}
