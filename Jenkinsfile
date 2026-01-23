pipeline {
    agent {
        kubernetes{
            label 'kube_m'
            defaultContainer 'jnlp'
        }
    }
    tools {
        none
    }
    triggers {
        pollSCM('H/5 * * * *')
    }
    options {
        buildDiscarder(logRotator(numToKeepStr: '1'))
        disableConcurrentBuilds()
        timeout(time: 1, unit: 'HOURS')
        skipDefaultCheckout()
        timestamps()
        disableResume()
        retry(1)
        ansiColor('xterm')
        preserveStashes(buildCount: 10)
        quietPeriod(5)
        lock(resource: 'prod-deploy')
        checkoutToSubdirectory('source')
    }
    environment {
        DOCKER_HUB_CREDENTIALS_ID = 'docker'
        GIT_BRANCH = "${params.GIT_BRANCH}"
        GITHUB_CREDENTIALS_ID = 'github'
        GITHUB_REPO = 'Rajendra0609/Rajendra0609/masala-and-mug'
        GITHUB_API_URL = 'https://api.github.com'
        EMAIL_RECIPIENTS = 'rajendra.daggubati09@gmail.com,srirajendraprasaddaggubati@gmail.com'
        TERM = 'xterm-256color'
        GITHUB_TOKEN = 'git_token'
        DOCKER_USER = 'docker_user'
        DOCKER_PASS = 'docker_token'
        SCANNER_HOME = tool 'sonar'
    }
    parameters {
        string(name: 'GIT_BRANCH', defaultValue: 'master', description: 'Branch to build')
        string(name: 'DOCKERHUBREPO', defaultValue: 'daggu1997/masalamugstaticweb', description: 'Docker Hub repository to push the image')
        string(name: 'VERSION', defaultValue: 'v0.0.1', description: 'Version of the Docker image')
        string(name: 'DOCKER_HUB_CREDENTIALS_ID', defaultValue: 'docker', description: 'Credentials ID for Docker Hub')
        string(name: 'GITHUB_CREDENTIALS_ID', defaultValue: 'github', description: 'Credentials ID for GitHub access')
        string(name: 'GITHUB_REPO', defaultValue: 'Rajendra0609/masala-and-mug', description: 'GitHub repository in owner/repo format')
        string(name: 'TAG', defaultValue: 'v0.0.1', description: 'Version of the tomcat deployment')
        string(name: 'EMAIL_RECIPIENTS', defaultValue: 'rajendra.daggubati09@gmail.com,srirajendraprasaddaggubati@gmail.com', description: 'Comma-separated list of email recipients')
    }
    stages {
        stage('node_status_check') {
            steps {
                script {
                    def status = sh(script: '/usr/local/bin/node_status.sh', returnStdout: true).trim()
                    echo "Node Status Output:\n${status}"
                    if (status.contains("ERROR") || status.contains("DOWN")) {
                        error("Node status check failed: ${status}")
                    }
                }

            }
        }
        stage('Checkout_startup') {
            steps {
                echo '🔄 cloing the code'
                checkout scm: [
                    $class: 'GitSCM',
                    branches: [[name: "${params.GIT_BRANCH}"]],
                    userRemoteConfigs: [[
                        url: "https://github.com/Rajendra0609/masala-and-mug.git",
                        credentialsId: 'github',
                        name: 'origin'
                    ]]
                ]
            }
        }
        stage('Gitleaks Scan') {
            steps {
                echo '🔍 Running Gitleaks...'
                sh '''
                gitleaks detect --source . --redact \
                --report-format=json \
                --report-path=gitleaks-report.json
                '''
                archiveArtifacts artifacts: 'gitleaks-report.json', onlyIfSuccessful: false
            }
        }
        stage('html_test') {
            steps {
                echo '🧪 Running HTML validation...'
                script {
                    sh 'npm install -g html-validator-cli'
                    sh 'html-validator --file=./index.html --verbose > validation-report.txt || true'
                }
                echo '✅ HTML validation completed.'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'validation-report.txt', allowEmptyArchive: true
                    junit 'validation-report.txt'
                }
            }
        }
        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies'
                script{
                    sh 'npm install'
                }
                echo 'Installed all dependencies'
            }
        }
        stage('Junit_test') {
            steps {
                echo "🧪 Running JUNIT validation..."
                script {
                    sh 'npm test'
                }
                echo "JUNIT TEST COMPLETED"
            }
            post {
                always {
                    archieveArtifacts artifacts: 'reports/junit/**/*.xml', fingerprint: true
                    junit 'reports/junit/**/*.xml'
                }
            }
        }

    }
    post {
        success {
            echo '✅ Build & Deploy completed successfully!'
            slackSend(
                channel: '#doc_jen_task_tracker',
                message: """
                    ✅ *Pipeline Success*
                    *Job:* `${env.JOB_NAME}`
                    *Build #:* `${env.BUILD_NUMBER}`
                    *Status:* Passed ✅
                    <${env.BUILD_URL}|View Build Logs>
                """
            )
            mail(
                to: "${EMAIL_RECIPIENTS}",
                subject: "SUCCESS: ${env.JOB_NAME} [#${env.BUILD_NUMBER}]",
                body: """\
                    The Jenkins Pipeline completed successfully.

                    🔗 Pipeline URL: ${env.BUILD_URL}
                    👷 Triggered by: ${currentBuild.getBuildCauses()[0].userName}

                    View the full job here: ${env.BUILD_URL}
                """
            )
        }

        failure {
            script {
                def log = currentBuild.rawBuild.getLog(1000)
                def lastLines = log.takeRight(50).join('\n')
                def culprit = "Unknown"
                def changeAuthor = "Unknown"

                try {
                    changeAuthor = currentBuild.changeSets.collect { cs ->
                        cs.items.collect { it.author.fullName }
                    }.flatten().unique().join(', ')
                    culprit = currentBuild.getBuildCauses()[0].userName
                } catch (e) {
                    echo "Failed to determine author or trigger: ${e.message}"
                }

                slackSend(
                    channel: '#doc_jen_task_tracker',
                    message: """
                        ❌ *Pipeline Failure*
                        *Job:* `${env.JOB_NAME}`
                        *Build #:* `${env.BUILD_NUMBER}`
                        *Status:* FAILED ❌
                        <${env.BUILD_URL}|View Build Logs>
                    """
                )
                mail(
                    to: "${EMAIL_RECIPIENTS}",
                    subject: "FAILURE: ${env.JOB_NAME} [#${env.BUILD_NUMBER}]",
                    body: """\
                        The Jenkins Pipeline has FAILED ❌

                        👤 Git Committer(s): ${changeAuthor}
                        🚀 Triggered by: ${culprit}
                        🔗 Pipeline URL: ${env.BUILD_URL}

                        📄 Last 50 lines of console output:
                        --------------------------------------------------
                        ${lastLines}
                        --------------------------------------------------

                        Please investigate the issue.
                    """
                )
            }
        }

        unstable {
            script {
                def log = currentBuild.rawBuild.getLog(1000)
                def lastLines = log.takeRight(50).join('\n')
                def culprit = "Unknown"
                def changeAuthor = "Unknown"

                try {
                    changeAuthor = currentBuild.changeSets.collect { cs ->
                        cs.items.collect { it.author.fullName }
                    }.flatten().unique().join(', ')
                    culprit = currentBuild.getBuildCauses()[0].userName
                } catch (e) {
                    echo "Failed to determine author or trigger: ${e.message}"
                }

                slackSend(
                    channel: '#doc_jen_task_tracker',
                    message: """
                        ⚠️ *Pipeline Unstable*
                        *Job:* `${env.JOB_NAME}`
                        *Build #:* `${env.BUILD_NUMBER}`
                        *Status:* UNSTABLE ⚠️
                        <${env.BUILD_URL}|View Build Logs>
                    """
                )
                mail(
                    to: "${EMAIL_RECIPIENTS}",
                    subject: "UNSTABLE: ${env.JOB_NAME} [#${env.BUILD_NUMBER}]",
                    body: """\
                        The Jenkins Pipeline is UNSTABLE ⚠️

                        👤 Git Committer(s): ${changeAuthor}
                        🚀 Triggered by: ${culprit}
                        🔗 Pipeline URL: ${env.BUILD_URL}

                        📄 Last 50 lines of console output:
                        --------------------------------------------------
                        ${lastLines}
                        --------------------------------------------------

                        Please investigate the warning.
                    """
                )
            }
        }

        always {
            cleanWs()
            echo '🧹 Workspace cleaned'
        }
    }
}