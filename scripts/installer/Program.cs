using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

namespace AICommandCenter.Installer
{
    class Program
    {
        static int Main(string[] args)
        {
            Console.Title = "Antigravity Apex - 1-Click Windows Setup";
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("=======================================================================");
            Console.WriteLine("    ANTIGRAVITY APEX - AUTOMATED 1-CLICK WINDOWS INSTALLER           ");
            Console.WriteLine("    Target: Google Antigravity & AI Development Director Suite         ");
            Console.WriteLine("=======================================================================");
            Console.ResetColor();
            Console.WriteLine();

            try
            {
                // 1. Check Node.js
                Console.Write("  [1/6] Checking Node.js runtime... ");
                string nodeVer = RunCommandCapture("node", "-v");
                if (string.IsNullOrEmpty(nodeVer) || !nodeVer.StartsWith("v"))
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("FAILED");
                    Console.ResetColor();
                    Console.WriteLine();
                    Console.WriteLine("  [ERROR] Node.js 18+ is required but was not found in PATH!");
                    Console.WriteLine("  Please download and install Node.js from: https://nodejs.org/");
                    Console.WriteLine("  Or install via Windows Package Manager: winget install OpenJS.NodeJS.LTS");
                    Console.WriteLine();
                    PromptExit(1);
                    return 1;
                }
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("OK (" + nodeVer.Trim() + ")");
                Console.ResetColor();

                // 2. Check Git
                Console.Write("  [2/6] Checking Git... ");
                string gitVer = RunCommandCapture("git", "--version");
                if (string.IsNullOrEmpty(gitVer))
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("WARNING (Git not in PATH)");
                    Console.ResetColor();
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("OK (" + gitVer.Trim() + ")");
                    Console.ResetColor();
                }

                // 3. Resolve Project Directory
                string projectDir = AppDomain.CurrentDomain.BaseDirectory;
                if (!File.Exists(Path.Combine(projectDir, "package.json")))
                {
                    projectDir = Directory.GetCurrentDirectory();
                }

                if (!File.Exists(Path.Combine(projectDir, "package.json")))
                {
                    Console.WriteLine("  [i] Repository not detected in current folder. Cloning from GitHub...");
                    string targetFolder = Path.Combine(projectDir, "antigravity-apex");
                    if (!Directory.Exists(targetFolder))
                    {
                        RunCommandLive("git", "clone https://github.com/fen3211/antigravity-apex.git \"" + targetFolder + "\"");
                    }
                    projectDir = targetFolder;
                }

                Directory.SetCurrentDirectory(projectDir);
                Console.WriteLine("  [3/6] Working directory: " + projectDir);

                // Auto-update if repository exists
                string gitDir = Path.Combine(projectDir, ".git");
                if (Directory.Exists(gitDir))
                {
                    Console.Write("        [Auto-Update] Checking for updates from GitHub... ");
                    string fetchRes = RunCommandCapture("git", "pull origin main");
                    if (!string.IsNullOrEmpty(fetchRes) && fetchRes.Contains("Already up to date"))
                    {
                        Console.ForegroundColor = ConsoleColor.Green;
                        Console.WriteLine("Up to date.");
                        Console.ResetColor();
                    }
                    else
                    {
                        Console.ForegroundColor = ConsoleColor.Cyan;
                        Console.WriteLine("Updated to latest.");
                        Console.ResetColor();
                    }
                }

                // 4. Setup .env file
                string envFile = Path.Combine(projectDir, ".env");
                string envExample = Path.Combine(projectDir, ".env.example");
                if (!File.Exists(envFile) && File.Exists(envExample))
                {
                    Console.Write("        Creating .env from .env.example... ");
                    File.Copy(envExample, envFile);
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("OK");
                    Console.ResetColor();
                }

                // 5. Install Dependencies
                Console.WriteLine("  [4/6] Verifying and installing npm packages...");
                if (!Directory.Exists(Path.Combine(projectDir, "node_modules")))
                {
                    Console.WriteLine("        Running 'npm install' in root...");
                    RunCommandLive("cmd.exe", "/c npm install");
                }
                else
                {
                    Console.WriteLine("        Root dependencies already installed.");
                }

                string clientDir = Path.Combine(projectDir, "client");
                if (!Directory.Exists(Path.Combine(clientDir, "node_modules")))
                {
                    Console.WriteLine("        Running 'npm install' in client...");
                    RunCommandLive("cmd.exe", "/c npm --prefix client install");
                }
                else
                {
                    Console.WriteLine("        Client dependencies already installed.");
                }

                string clientDist = Path.Combine(clientDir, "dist");
                string serverDist = Path.Combine(projectDir, "server", "dist");
                if (!Directory.Exists(clientDist) || !Directory.Exists(serverDist))
                {
                    Console.WriteLine("        Building server and client distribution...");
                    RunCommandLive("cmd.exe", "/c npm run server:build");
                    RunCommandLive("cmd.exe", "/c npm run client:build");
                }

                // 6. Deploy Antigravity Agents Suite
                Console.WriteLine("  [5/6] Deploying 17 Specialist Agents to Antigravity (~/.gemini)...");
                string installPs1 = Path.Combine(projectDir, "scripts", "install.ps1");
                if (File.Exists(installPs1))
                {
                    RunCommandLive("powershell.exe", "-NoProfile -ExecutionPolicy Bypass -File \"" + installPs1 + "\" -Force");
                }

                // 7. Run Diagnostic Doctor
                Console.WriteLine("  [6/6] Running System Diagnostic Doctor...");
                string doctorJs = Path.Combine(projectDir, "scripts", "doctor.js");
                if (File.Exists(doctorJs))
                {
                    RunCommandLive("node", "\"" + doctorJs + "\"");
                }

                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("=======================================================================");
                Console.WriteLine("  SUCCESS! Antigravity Apex is fully installed and verified.");
                Console.WriteLine("  Launching Web Dashboard: http://127.0.0.1:5173/");
                Console.WriteLine("=======================================================================");
                Console.ResetColor();
                Console.WriteLine();

                // Open browser
                ThreadPool.QueueUserWorkItem(delegate
                {
                    Thread.Sleep(2000);
                    try
                    {
                        Process.Start("http://127.0.0.1:5173/");
                    }
                    catch { }
                });

                // Launch development server
                RunCommandLive("cmd.exe", "/c npm run dev");

                return 0;
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("\n[ERROR] An unexpected error occurred during installation:");
                Console.WriteLine(ex.ToString());
                Console.ResetColor();
                PromptExit(1);
                return 1;
            }
        }

        static string RunCommandCapture(string fileName, string args)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo(fileName, args)
                {
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (Process p = Process.Start(psi))
                {
                    string output = p.StandardOutput.ReadToEnd();
                    p.WaitForExit();
                    return output;
                }
            }
            catch
            {
                return null;
            }
        }

        static int RunCommandLive(string fileName, string args)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo(fileName, args)
                {
                    UseShellExecute = false
                };
                using (Process p = Process.Start(psi))
                {
                    p.WaitForExit();
                    return p.ExitCode;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Command failed (" + fileName + " " + args + "): " + ex.Message);
                return -1;
            }
        }

        static void PromptExit(int code)
        {
            Console.WriteLine("\nPress any key to exit...");
            try
            {
                Console.ReadKey();
            }
            catch { }
            Environment.Exit(code);
        }
    }
}
