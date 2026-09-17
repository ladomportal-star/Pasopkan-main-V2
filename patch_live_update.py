import re

with open('frontend/src/components/OrganizerEventAnalytics.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = "  const [isLiveUpdateEnabled, setIsLiveUpdateEnabled] = useState(false);\n"
replacement1 = ""
content = content.replace(target1, replacement1)

target2 = """  // Handle the live update interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLiveUpdateEnabled) {
      interval = setInterval(() => {
        setRefreshTick(prev => prev + 1);
        setShowRefreshToast(true);
        setTimeout(() => setShowRefreshToast(false), 3000); // Hide after 3 seconds
      }, 60000); // 60 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveUpdateEnabled]);"""

replacement2 = """  // Handle the live update interval
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick(prev => prev + 1);
      setShowRefreshToast(true);
      setTimeout(() => setShowRefreshToast(false), 3000); // Hide after 3 seconds
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);"""

content = content.replace(target2, replacement2)

target3_regex = re.compile(r"          \{\/\* Live Update Toggle \*\/\}.*?          \{\/\* Event Selector Dropdown \*\/\}", re.DOTALL)
replacement3 = "          {/* Event Selector Dropdown */}"
if target3_regex.search(content):
    content = target3_regex.sub(replacement3, content)

with open('frontend/src/components/OrganizerEventAnalytics.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied Live Update patch")
