package com.expense.tracker.controller;

import com.expense.tracker.model.Expense;
import com.expense.tracker.repository.ExpenseRepository;
import com.expense.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ExpenseController {

    private final ExpenseRepository expenseRepo;
    private final UserRepository userRepo;

    @GetMapping
    public List<Expense> getAll(Authentication auth) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        return expenseRepo.findByUserIdOrderByExpenseDateDesc(user.getId());
    }

    @PostMapping
    public Expense create(@RequestBody Expense expense, Authentication auth) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        expense.setUser(user);
        if (expense.getExpenseDate() == null)
            expense.setExpenseDate(LocalDate.now());
        return expenseRepo.save(expense);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Expense> update(@PathVariable Long id,
                                          @RequestBody Expense updated, Authentication auth) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        return expenseRepo.findById(id)
                .filter(e -> e.getUser().getId().equals(user.getId()))
                .map(e -> {
                    e.setAmount(updated.getAmount());
                    e.setDescription(updated.getDescription());
                    e.setCategory(updated.getCategory());
                    e.setPayee(updated.getPayee());
                    e.setExpenseDate(updated.getExpenseDate());
                    e.setType(updated.getType());
                    e.setNotes(updated.getNotes());
                    return ResponseEntity.ok(expenseRepo.save(e));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        return expenseRepo.findById(id)
                .filter(e -> e.getUser().getId().equals(user.getId()))
                .map(e -> { expenseRepo.delete(e);
                    return ResponseEntity.ok().<Void>build(); })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/summary")
    public Map<String, Object> getSummary(Authentication auth,
                                          @RequestParam(defaultValue = "0") int month,
                                          @RequestParam(defaultValue = "0") int year) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        int m = month == 0 ? LocalDate.now().getMonthValue() : month;
        int y = year == 0 ? LocalDate.now().getYear() : year;
        var total = expenseRepo.getTotalExpensesByMonth(user.getId(), m, y);
        var byCategory = expenseRepo.getCategoryTotals(user.getId(), m, y);
        return Map.of("totalExpenses", total != null ? total : 0,
                "month", m, "year", y, "byCategory", byCategory);
    }
}