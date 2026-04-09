export interface SampleCode {
  language: string;
  label: string;
  code: string;
}

export const SAMPLE_CODES: SampleCode[] = [
  {
    language: "JavaScript",
    label: "JavaScript — Fetch User Data",
    code: `async function fetchUser(userId) {
  const response = await fetch(\`https://api.example.com/users/\${userId}\`);
  const data = response.json();  // Missing await!
  return data.name;
}

function processUsers(users) {
  var result = [];
  for (var i = 0; i <= users.length; i++) {  // Off-by-one error
    result.push(users[i].name.toUpperCase());
  }
  return result;
}

// Unused variable
const config = { timeout: 5000, retries: 3 };
fetchUser(42).then(name => console.log(name));
`,
  },
  {
    language: "Python",
    label: "Python — Calculate Average",
    code: `def calculate_average(numbers):
    total = 0
    for number in numbers:
        total += number
    average = total / len(numbers)
    return average

# Test the function
data = [10, 20, 30, 40, 50]
print(calculate_average(data))
print(calculate_average([]))  # This will cause a ZeroDivisionError
`,
  },
  {
    language: "Java",
    label: "Java — String Processor",
    code: `import java.util.ArrayList;
import java.util.List;

public class StringProcessor {
    private List<String> items = new ArrayList<>();

    public void addItem(String item) {
        items.add(item);  // No null check
    }

    public String getFirst() {
        return items.get(0);  // No bounds check
    }

    public int countOccurrences(String target) {
        int count = 0;
        for (int i = 0; i < items.size(); i++) {
            if (items.get(i) == target) {  // Should use .equals()
                count++;
            }
        }
        return count;
    }

    public static void main(String[] args) {
        StringProcessor sp = new StringProcessor();
        sp.addItem("hello");
        sp.addItem("world");
        System.out.println(sp.getFirst());
        System.out.println(sp.countOccurrences("hello"));
    }
}
`,
  },
  {
    language: "TypeScript",
    label: "TypeScript — Generic Stack",
    code: `class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T {
    return this.items.pop()!; // No empty check — runtime error if empty
  }

  peek(): T {
    return this.items[this.items.length - 1]; // Returns undefined when empty
  }

  get size(): number {
    return this.items.length;
  }
}

const stack = new Stack<number>();
stack.push(1);
stack.push(2);
console.log(stack.pop());
console.log(stack.pop());
console.log(stack.pop()); // undefined — no guard
`,
  },
  {
    language: "C++",
    label: "C++ — Linked List",
    code: `#include <iostream>

struct Node {
    int data;
    Node* next;
};

class LinkedList {
public:
    Node* head = nullptr;

    void insert(int val) {
        Node* newNode = new Node{val, head};
        head = newNode;
    }

    void print() {
        Node* curr = head;
        while (curr != nullptr) {
            std::cout << curr->data << " ";
            curr = curr->next;
        }
        std::cout << std::endl;
    }

    // Missing destructor — memory leak!
};

int main() {
    LinkedList list;
    list.insert(3);
    list.insert(2);
    list.insert(1);
    list.print();
    return 0;
}
`,
  },
  {
    language: "C",
    label: "C — String Reverse",
    code: `#include <stdio.h>
#include <string.h>

void reverseString(char* str) {
    int n = strlen(str);
    for (int i = 0; i < n / 2; i++) {
        char temp = str[i];
        str[i] = str[n - i - 1];
        str[n - i - 1] = temp;
    }
}

int main() {
    char s[] = "hello world";
    reverseString(s);
    printf("%s\\n", s);

    // Potential buffer overflow — no bounds check
    char buf[5];
    gets(buf); // Unsafe: use fgets instead
    printf("%s\\n", buf);
    return 0;
}
`,
  },
  {
    language: "C#",
    label: "C# — File Reader",
    code: `using System;
using System.IO;

class FileReader {
    public static string ReadFile(string path) {
        // No exception handling
        StreamReader reader = new StreamReader(path);
        string content = reader.ReadToEnd();
        reader.Close(); // Should use 'using' statement
        return content;
    }

    static void Main(string[] args) {
        string text = ReadFile("data.txt");
        Console.WriteLine(text.Substring(0, 100)); // May throw if file < 100 chars
    }
}
`,
  },
  {
    language: "Go",
    label: "Go — HTTP Handler",
    code: `package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type User struct {
	Name  string \`json:"name"\`
	Email string \`json:"email"\`
}

func getUser(w http.ResponseWriter, r *http.Request) {
	user := User{Name: "Alice", Email: "alice@example.com"}
	data, _ := json.Marshal(user) // Ignoring error
	fmt.Fprintf(w, string(data))  // Should set Content-Type header
}

func main() {
	http.HandleFunc("/user", getUser)
	http.ListenAndServe(":8080", nil) // Ignoring error
}
`,
  },
  {
    language: "Rust",
    label: "Rust — Vec Operations",
    code: `fn find_max(numbers: &Vec<i32>) -> i32 {
    let mut max = numbers[0]; // Panics on empty vec
    for &n in numbers.iter() {
        if n > max {
            max = n;
        }
    }
    max
}

fn double_values(numbers: Vec<i32>) -> Vec<i32> {
    let mut result = Vec::new();
    for n in numbers {
        result.push(n * 2);
    }
    result // Could use .iter().map(|&n| n * 2).collect()
}

fn main() {
    let nums = vec![3, 1, 4, 1, 5, 9, 2, 6];
    println!("Max: {}", find_max(&nums));
    println!("Doubled: {:?}", double_values(nums));
}
`,
  },
  {
    language: "Kotlin",
    label: "Kotlin — Data Class",
    code: `data class Person(val name: String, val age: Int)

fun filterAdults(people: List<Person>): List<Person> {
    val result = mutableListOf<Person>()
    for (person in people) {
        if (person.age >= 18) {
            result.add(person)
        }
    }
    return result // Could use people.filter { it.age >= 18 }
}

fun main() {
    val people = listOf(
        Person("Alice", 25),
        Person("Bob", 16),
        Person("Charlie", 30),
        Person("Diana", 15)
    )
    val adults = filterAdults(people)
    adults.forEach { println(it.name) }
}
`,
  },
  {
    language: "Swift",
    label: "Swift — Optionals",
    code: `import Foundation

struct User {
    let name: String
    let email: String?
}

func sendEmail(to user: User) {
    let email = user.email! // Force unwrap — crashes if nil
    print("Sending email to \\(email)")
}

func getUserAge(from dict: [String: Any]) -> Int {
    return dict["age"] as! Int // Force cast — risky
}

let alice = User(name: "Alice", email: nil)
sendEmail(to: alice) // Will crash!

let data: [String: Any] = ["name": "Bob", "age": "not a number"]
print(getUserAge(from: data)) // Will crash!
`,
  },
  {
    language: "PHP",
    label: "PHP — Login Form",
    code: `<?php
$username = $_GET['username']; // Should use POST and sanitize
$password = $_GET['password'];

$conn = mysqli_connect("localhost", "root", "", "mydb");

// SQL Injection vulnerability!
$query = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
$result = mysqli_query($conn, $query);

if (mysqli_num_rows($result) > 0) {
    echo "Login successful";
} else {
    echo "Invalid credentials";
}

mysqli_close($conn);
?>
`,
  },
  {
    language: "Ruby",
    label: "Ruby — Array Methods",
    code: `def find_duplicates(arr)
  duplicates = []
  arr.each_with_index do |item, i|
    arr.each_with_index do |other, j|
      if i != j && item == other && !duplicates.include?(item)
        duplicates << item
      end
    end
  end
  duplicates # O(n^3) — very inefficient
end

names = ["alice", "bob", "alice", "charlie", "bob", "dave"]
puts find_duplicates(names).inspect
`,
  },
  {
    language: "Scala",
    label: "Scala — Factorial",
    code: `object MathUtils {
  def factorial(n: Int): Long = {
    if (n < 0) throw new IllegalArgumentException("Negative input")
    var result = 1L
    var i = 1
    while (i <= n) {
      result *= i
      i += 1
    }
    result // Could use tail-recursive approach
  }

  def main(args: Array[String]): Unit = {
    for (i <- 0 to 10) {
      println(s"$i! = \${factorial(i)}")
    }
    println(factorial(21)) // Overflows Long!
  }
}
`,
  },
  {
    language: "Dart",
    label: "Dart — Counter Widget",
    code: `class Counter {
  int _count = 0;

  void increment() => _count++;
  void decrement() => _count--;

  int get value => _count;

  void reset() {
    _count = 0;
  }
}

void main() {
  final counter = Counter();
  counter.increment();
  counter.increment();
  counter.increment();
  counter.decrement();
  print('Count: \${counter.value}'); // Should be 2

  // No validation — can go negative infinitely
  for (int i = 0; i < 10; i++) {
    counter.decrement();
  }
  print('Count after decrement: \${counter.value}'); // -8
}
`,
  },
  {
    language: "Haskell",
    label: "Haskell — List Utilities",
    code: `module ListUtils where

-- Safe head — returns Maybe
safeHead :: [a] -> Maybe a
safeHead [] = Nothing
safeHead (x:_) = Just x

-- Compute running sum
runningSum :: [Int] -> [Int]
runningSum [] = []
runningSum xs = scanl1 (+) xs

-- Remove consecutive duplicates
compress :: Eq a => [a] -> [a]
compress [] = []
compress [x] = [x]
compress (x:y:rest)
  | x == y    = compress (y:rest)
  | otherwise = x : compress (y:rest)

main :: IO ()
main = do
  print $ safeHead ([] :: [Int])
  print $ runningSum [1, 2, 3, 4, 5]
  print $ compress [1,1,2,3,3,3,4,4,5]
`,
  },
  {
    language: "Lua",
    label: "Lua — Table Utils",
    code: `-- Map function over a table
function map(t, fn)
  local result = {}
  for i, v in ipairs(t) do
    result[i] = fn(v)
  end
  return result
end

-- Filter function
function filter(t, predicate)
  local result = {}
  for _, v in ipairs(t) do
    if predicate(v) then
      result[#result + 1] = v
    end
  end
  return result
end

local numbers = {1, 2, 3, 4, 5, 6, 7, 8}
local doubled = map(numbers, function(x) return x * 2 end)
local evens = filter(numbers, function(x) return x % 2 == 0 end)

-- No print utility — relies on manual loop
for _, v in ipairs(doubled) do io.write(v .. " ") end
print()
`,
  },
  {
    language: "R",
    label: "R — Data Analysis",
    code: `# Load and summarise a simple dataset
scores <- c(85, 92, 78, 90, 88, 76, 95, 82, 89, 91)

mean_score <- mean(scores)
sd_score <- sd(scores)
median_score <- median(scores)

cat("Mean:", mean_score, "\\n")
cat("SD:", sd_score, "\\n")
cat("Median:", median_score, "\\n")

# Simple linear model — no validation
x <- 1:10
y <- 2 * x + rnorm(10, 0, 1)
model <- lm(y ~ x)
summary(model)

# Potential issue: no NA handling
scores_with_na <- c(scores, NA, NA)
cat("Mean with NA:", mean(scores_with_na), "\\n") # Returns NA
`,
  },
  {
    language: "MATLAB",
    label: "MATLAB — Matrix Operations",
    code: `% Matrix operations example
A = [1 2 3; 4 5 6; 7 8 9];
b = [1; 2; 3];

% Solve Ax = b
% A is singular — this will warn or error
x = A \\ b;
disp(x);

% Eigenvalues
[V, D] = eig(A);
disp('Eigenvalues:');
disp(diag(D));

% Element-wise vs matrix multiply — common mistake
C = A * A;   % Matrix multiplication
D2 = A .* A; % Element-wise — intended?
disp(C - D2);
`,
  },
  {
    language: "SQL",
    label: "SQL — Query Optimization",
    code: `-- Find top customers by total order value
SELECT
    c.customer_id,
    c.name,
    SUM(o.amount) AS total_spent
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.status = 'completed'
GROUP BY c.customer_id, c.name
HAVING SUM(o.amount) > 1000
ORDER BY total_spent DESC;

-- Potential N+1 issue: fetching order items separately
SELECT * FROM orders WHERE customer_id = 42;
SELECT * FROM order_items WHERE order_id = 1;
SELECT * FROM order_items WHERE order_id = 2;
-- Should JOIN order_items in one query instead
`,
  },
];

export function getSampleForLanguage(language: string): string | null {
  const sample = SAMPLE_CODES.find((s) => s.language === language);
  return sample?.code ?? null;
}
