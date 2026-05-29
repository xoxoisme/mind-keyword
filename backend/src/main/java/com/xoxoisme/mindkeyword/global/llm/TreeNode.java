package com.xoxoisme.mindkeyword.global.llm;

import java.util.List;

public record TreeNode(
        String content,
        List<TreeNode> children
) {
}
