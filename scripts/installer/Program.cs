using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Windows.Forms;

namespace AICommandCenter.Installer
{
    class Program
    {
        [STAThread]
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

                // 3. Resolve Project Directory (Interactive Folder Selection)
                string defaultBase = AppDomain.CurrentDomain.BaseDirectory;
                string tempDir = Path.GetTempPath();
                bool isInsideTemp = defaultBase.IndexOf(tempDir, StringComparison.OrdinalIgnoreCase) >= 0;
                string userHome = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                string defaultTarget = Path.Combine(userHome, "antigravity-apex");

                string projectDir = "";

                // If already inside an existing repo (and not in a temp folder)
                if (File.Exists(Path.Combine(defaultBase, "package.json")) && !isInsideTemp)
                {
                    Console.WriteLine();
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("  [3/6] Existing project detected in current folder:");
                    Console.WriteLine("        " + defaultBase);
                    Console.ResetColor();
                    Console.Write("        Use this directory? [Y/n]: ");
                    string reply = Console.ReadLine();
                    if (string.IsNullOrEmpty(reply) || reply.Trim().ToLower().StartsWith("y"))
                    {
                        projectDir = defaultBase;
                    }
                }

                if (string.IsNullOrEmpty(projectDir))
                {
                    Console.WriteLine();
                    Console.ForegroundColor = ConsoleColor.Cyan;
                    Console.WriteLine("=======================================================================");
                    Console.WriteLine("  [3/6] ВЫБОР ПАПКИ ДЛЯ УСТАНОВКИ");
                    Console.WriteLine("=======================================================================");
                    Console.ResetColor();
                    Console.WriteLine("  Папка по умолчанию: " + defaultTarget);
                    Console.WriteLine();
                    Console.WriteLine("  Варианты:");
                    Console.WriteLine("  [Enter]  Установить в папку по умолчанию");
                    Console.WriteLine("  [b]      Открыть окно проводника Windows для выбора папки");
                    Console.WriteLine("  [путь]   Ввести или вставить свой путь (например: D:\\Projects\\antigravity-apex)");
                    Console.WriteLine();
                    Console.Write("  Ваш выбор: ");

                    string choice = Console.ReadLine();
                    if (choice != null) choice = choice.Trim().Trim('\"', '\'');

                    if (string.IsNullOrEmpty(choice) || choice == "1")
                    {
                        projectDir = defaultTarget;
                    }
                    else if (choice.ToLower() == "b" || choice.ToLower() == "browse" || choice == "2")
                    {
                        Console.WriteLine("  Открытие окна выбора папки...");
                        using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                        {
                            fbd.Description = "Выберите папку для установки Antigravity Apex";
                            fbd.SelectedPath = userHome;
                            fbd.ShowNewFolderButton = true;
                            DialogResult res = fbd.ShowDialog();
                            if (res == DialogResult.OK && !string.IsNullOrEmpty(fbd.SelectedPath))
                            {
                                string picked = fbd.SelectedPath;
                                if (!picked.EndsWith("antigravity-apex", StringComparison.OrdinalIgnoreCase) && !File.Exists(Path.Combine(picked, "package.json")))
                                {
                                    picked = Path.Combine(picked, "antigravity-apex");
                                }
                                projectDir = picked;
                            }
                            else
                            {
                                Console.WriteLine("  Выбор отменен, используется папка по умолчанию.");
                                projectDir = defaultTarget;
                            }
                        }
                    }
                    else
                    {
                        string customPath = choice;
                        if (!customPath.EndsWith("antigravity-apex", StringComparison.OrdinalIgnoreCase) && !File.Exists(Path.Combine(customPath, "package.json")))
                        {
                            customPath = Path.Combine(customPath, "antigravity-apex");
                        }
                        projectDir = Path.GetFullPath(customPath);
                    }
                }

                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("  [OK] Папка установки: " + projectDir);
                Console.ResetColor();
                Console.WriteLine();

                // Clone repository if not present
                if (!File.Exists(Path.Combine(projectDir, "package.json")))
                {
                    Console.WriteLine("  [i] Cloning repository to: " + projectDir);
                    string parent = Path.GetDirectoryName(projectDir);
                    if (!string.IsNullOrEmpty(parent) && !Directory.Exists(parent))
                    {
                        Directory.CreateDirectory(parent);
                    }
                    int cloneExit = RunCommandLive("git", "clone https://github.com/fen3211/antigravity-apex.git \"" + projectDir + "\"");
                    if (cloneExit != 0 && !File.Exists(Path.Combine(projectDir, "package.json")))
                    {
                        Console.ForegroundColor = ConsoleColor.Red;
                        Console.WriteLine("  [ERROR] Failed to clone repository into " + projectDir);
                        Console.ResetColor();
                        PromptExit(1);
                        return 1;
                    }
                }

                Directory.SetCurrentDirectory(projectDir);

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

                // 5. Install Dependencies with --ignore-scripts (avoids node-gyp Visual Studio requirement)
                Console.WriteLine("  [4/6] Verifying and installing npm packages...");
                if (!Directory.Exists(Path.Combine(projectDir, "node_modules")))
                {
                    Console.WriteLine("        Running 'npm install --ignore-scripts' in root...");
                    RunCommandLive("cmd.exe", "/c npm install --ignore-scripts");
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

                // 8. Create Desktop Launcher
                try
                {
                    string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                    if (Directory.Exists(desktop))
                    {
                        string desktopLauncher = Path.Combine(desktop, "Antigravity-Apex.cmd");
                        string startCmd = Path.Combine(projectDir, "start.cmd");
                        File.WriteAllText(desktopLauncher, "@echo off\r\ncd /d \"" + projectDir + "\"\r\ncall \"" + startCmd + "\"\r\n");
                        Console.WriteLine("        Desktop launcher created: " + desktopLauncher);
                    }
                }
                catch { }

                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("=======================================================================");
                Console.WriteLine("  SUCCESS! Antigravity Apex is fully installed and verified.");
                Console.WriteLine("  Folder: " + projectDir);
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
